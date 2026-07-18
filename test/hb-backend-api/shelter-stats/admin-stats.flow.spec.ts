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
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { GetAdminStatsUseCase } from "src/hb-backend-api/shelter-stats/domain/ports/in/get-admin-stats.use-case";

/**
 * §07.7 operator dashboard end-to-end: seeds data across all five collections
 * and proves the platform-wide composition (verified shelters, active users +
 * this-month signups, adoptions total + this month, pending queue) through the
 * real DI graph. Operator-only access is enforced.
 */
describe("Admin stats (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let adminStats: GetAdminStatsUseCase;
  let shelterModel: Model<ShelterEntity>;
  let userModel: Model<UserEntity>;
  let animalModel: Model<AnimalEntity>;
  let adoptionModel: Model<AdoptionApplicationEntity>;
  let fosterModel: Model<FosterApplicationEntity>;

  let seq = 0;
  const seedUser = async (roles: UserRole[]): Promise<string> => {
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
      roles,
      shelterRoles: [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id.toHexString();
  };

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

    adminStats = app.get(DIToken.ShelterStatsModule.GetAdminStatsUseCase);
    shelterModel = app.get(getModelToken(ShelterEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
    animalModel = app.get(getModelToken(AnimalEntity.name));
    adoptionModel = app.get(getModelToken(AdoptionApplicationEntity.name));
    fosterModel = app.get(getModelToken(FosterApplicationEntity.name));
  }, 60_000);

  afterEach(async () => {
    await Promise.all([
      shelterModel.deleteMany({}).exec(),
      userModel.deleteMany({}).exec(),
      animalModel.deleteMany({}).exec(),
      adoptionModel.deleteMany({}).exec(),
      fosterModel.deleteMany({}).exec(),
    ]);
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  const insert = (model: Model<unknown>, docs: object[]): Promise<unknown> =>
    model.collection.insertMany(
      docs.map((d) => ({ _id: new Types.ObjectId(), ...d })),
    );

  it("composes platform-wide KPIs for an operator", async () => {
    const admin = await seedUser([UserRole.USER, UserRole.SYSTEM_ADMIN]);
    await seedUser([UserRole.USER]);
    await seedUser([UserRole.USER]);

    await insert(shelterModel, [
      { status: ShelterStatus.VERIFIED, slug: `s-${seq}-a` },
      { status: ShelterStatus.VERIFIED, slug: `s-${seq}-b` },
      { status: ShelterStatus.PENDING_VERIFICATION, slug: `s-${seq}-c` },
    ]);
    await insert(animalModel, [
      { status: AnimalStatus.ADOPTED },
      { status: AnimalStatus.ADOPTED },
      { status: AnimalStatus.AVAILABLE },
    ]);
    const now = new Date();
    await insert(adoptionModel, [
      { status: AdoptionApplicationStatus.APPROVED, updatedAt: now },
      { status: AdoptionApplicationStatus.APPROVED, updatedAt: now },
      { status: AdoptionApplicationStatus.PENDING, updatedAt: now },
    ]);
    await insert(fosterModel, [{ status: FosterApplicationStatus.PENDING }]);

    const stats = await adminStats.invoke(admin);

    expect(stats.verifiedShelters).toBe(2);
    expect(stats.activeUsers).toBe(3); // admin + 2
    expect(stats.thisMonthSignups).toBe(3);
    expect(stats.totalAdoptions).toBe(2);
    expect(stats.thisMonthAdoptions).toBe(2);
    // adoption PENDING (1) + foster PENDING (1)
    expect(stats.pendingApplications).toBe(2);
  });

  it("refuses a non-operator", async () => {
    const user = await seedUser([UserRole.USER]);
    await expect(adminStats.invoke(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
