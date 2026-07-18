import { ForbiddenException, INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { GetShelterDashboardUseCase } from "src/hb-backend-api/shelter-stats/domain/ports/in/get-shelter-dashboard.use-case";
import { monthlyBuckets } from "src/hb-backend-api/shelter-stats/application/month-buckets";

/**
 * §07 dashboard end-to-end: seeds animal inventory + adoption/foster application
 * read models and proves the cross-module composition (rate, monthly trend, and
 * pending queue) through the real DI graph and Mongo. Staff-scoped access is
 * enforced by the use-case.
 */
describe("Shelter dashboard (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let dashboard: GetShelterDashboardUseCase;
  let animalModel: Model<AnimalEntity>;
  let adoptionModel: Model<AdoptionApplicationEntity>;
  let fosterModel: Model<FosterApplicationEntity>;
  let userModel: Model<UserEntity>;

  const shelterId = new Types.ObjectId();
  let staffId: Types.ObjectId;
  let outsiderId: Types.ObjectId;

  let seq = 0;
  const seedUser = async (withStaffRole: boolean): Promise<Types.ObjectId> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `u-${seq}`,
      realNameEnc: "enc",
      passwordHash: "hashed",
      phoneEnc: "enc",
      email: `u-${id.toHexString()}@example.com`,
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles: withStaffRole
        ? [{ shelterId, role: UserRole.SHELTER_STAFF }]
        : [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id;
  };

  const insertAnimals = (status: AnimalStatus, n: number): Promise<unknown> =>
    animalModel.collection.insertMany(
      Array.from({ length: n }, () => ({
        _id: new Types.ObjectId(),
        shelterId,
        status,
      })),
    );

  const insertAdoption = (
    status: AdoptionApplicationStatus,
    updatedAt: Date,
  ): Promise<unknown> =>
    adoptionModel.collection.insertOne({
      _id: new Types.ObjectId(),
      shelterId,
      status,
      createdAt: updatedAt,
      updatedAt,
    });

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB = mongo.getUri();
    process.env.NODE_ENV = "test";
    process.env.HOBOM_JWT_SECRET = "s";
    process.env.HOBOM_JWT_REFRESH_SECRET = "r";
    process.env.HOBOM_JWT_ACCESS_TOKEN_EXPIRED = "15m";
    process.env.HOBOM_JWT_REFRESH_TOKEN_EXPIRED = "30d";
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

    const { AppModule } = await import("src/app.module");
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dashboard = app.get(DIToken.ShelterStatsModule.GetShelterDashboardUseCase);
    animalModel = app.get(getModelToken(AnimalEntity.name));
    adoptionModel = app.get(getModelToken(AdoptionApplicationEntity.name));
    fosterModel = app.get(getModelToken(FosterApplicationEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));

    staffId = await seedUser(true);
    outsiderId = await seedUser(false);

    // Inventory: 3 ADOPTED, 2 AVAILABLE, 1 FOSTERED → sheltered 3, available 2.
    await insertAnimals(AnimalStatus.ADOPTED, 3);
    await insertAnimals(AnimalStatus.AVAILABLE, 2);
    await insertAnimals(AnimalStatus.FOSTERED, 1);

    const buckets = monthlyBuckets(new Date(), 6);
    const thisMonth = new Date(buckets[5].from.getTime() + 60_000);
    const lastMonth = new Date(buckets[4].from.getTime() + 60_000);
    // 2 approved this month, 1 last month, 1 pending.
    await insertAdoption(AdoptionApplicationStatus.APPROVED, thisMonth);
    await insertAdoption(AdoptionApplicationStatus.APPROVED, thisMonth);
    await insertAdoption(AdoptionApplicationStatus.APPROVED, lastMonth);
    await insertAdoption(AdoptionApplicationStatus.PENDING, thisMonth);
    // 1 pending foster.
    await fosterModel.collection.insertOne({
      _id: new Types.ObjectId(),
      shelterId,
      status: FosterApplicationStatus.PENDING,
      createdAt: thisMonth,
      updatedAt: thisMonth,
    });
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("composes the full dashboard for a shelter staff member", async () => {
    const result = await dashboard.invoke(
      shelterId.toHexString(),
      staffId.toHexString(),
    );

    expect(result.adoptedCount).toBe(3);
    expect(result.shelteredCount).toBe(3);
    expect(result.availableCount).toBe(2);
    // 3 / (3 + 3) = 0.5
    expect(result.adoptionRate).toBe(0.5);
    expect(result.monthlyAdoptions).toHaveLength(6);
    expect(result.thisMonthAdoptions).toBe(2);
    expect(result.lastMonthAdoptions).toBe(1);
    // adoption PENDING (1) + foster PENDING (1)
    expect(result.pendingApplications).toBe(2);
  });

  it("refuses a non-staff actor", async () => {
    await expect(
      dashboard.invoke(shelterId.toHexString(), outsiderId.toHexString()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
