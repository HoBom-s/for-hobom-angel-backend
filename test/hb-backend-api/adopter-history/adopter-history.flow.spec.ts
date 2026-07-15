import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";
import { GetAdopterHistoryUseCase } from "src/hb-backend-api/adopter-history/domain/ports/in/get-adopter-history.use-case";

/**
 * End-to-end screening slice: a shelter operator looks up an applicant's
 * placement/return record, aggregated from adoption/foster + account status.
 * Non-staff are refused.
 */
describe("Adopter history (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let getHistory: GetAdopterHistoryUseCase;
  let userModel: Model<UserEntity>;
  let adoptionModel: Model<AdoptionApplicationEntity>;
  let fosterModel: Model<FosterApplicationEntity>;

  const shelterId = new Types.ObjectId();
  let seq = 0;

  const seedUser = async (
    status: UserStatus = UserStatus.ACTIVE,
    shelterRoles: object[] = [],
  ): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `u-${seq}`,
      email: `u-${id.toHexString()}@example.com`,
      passwordHash: "hashed",
      realNameEnc: "enc",
      phoneEnc: "enc",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles,
      status,
      version: 0,
    });
    return id.toHexString();
  };

  const seedAdoption = async (
    applicantId: string,
    status: AdoptionApplicationStatus,
  ): Promise<void> => {
    await adoptionModel.create({
      _id: new Types.ObjectId(),
      animalId: new Types.ObjectId(),
      shelterId,
      applicantId: new Types.ObjectId(applicantId),
      questionnaireVersion: 1,
      answers: [],
      status,
      version: 0,
    });
  };

  const seedFoster = async (
    applicantId: string,
    status: FosterApplicationStatus,
  ): Promise<void> => {
    await fosterModel.create({
      _id: new Types.ObjectId(),
      animalId: new Types.ObjectId(),
      shelterId,
      applicantId: new Types.ObjectId(applicantId),
      questionnaireVersion: 1,
      answers: [],
      plannedEndDate: null,
      status,
      endedAt: null,
      version: 0,
    });
  };

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB = mongo.getUri();
    process.env.NODE_ENV = "test";
    process.env.HOBOM_JWT_SECRET = "test-access-secret";
    process.env.HOBOM_JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.HOBOM_JWT_ACCESS_TOKEN_EXPIRED = "15m";
    process.env.HOBOM_JWT_REFRESH_TOKEN_EXPIRED = "30d";
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

    const { AppModule } = await import("src/app.module");
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    getHistory = app.get(DIToken.AdopterHistoryModule.GetAdopterHistoryUseCase);
    userModel = app.get(getModelToken(UserEntity.name));
    adoptionModel = app.get(getModelToken(AdoptionApplicationEntity.name));
    fosterModel = app.get(getModelToken(FosterApplicationEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("aggregates an applicant's adoptions, returns, and fosters for a shelter operator", async () => {
    const staff = await seedUser(UserStatus.ACTIVE, [
      { shelterId, role: UserRole.SHELTER_ADMIN },
    ]);
    const applicant = await seedUser();

    await seedAdoption(applicant, AdoptionApplicationStatus.APPROVED);
    await seedAdoption(applicant, AdoptionApplicationStatus.APPROVED);
    await seedAdoption(applicant, AdoptionApplicationStatus.RETURNED);
    await seedAdoption(applicant, AdoptionApplicationStatus.REJECTED); // ignored
    await seedFoster(applicant, FosterApplicationStatus.APPROVED);

    const history = await getHistory.invoke({
      userId: applicant,
      viewerId: staff,
    });

    expect(history).toEqual({
      userId: applicant,
      adoptions: 2,
      returns: 1,
      fosters: 1,
      sanctioned: false,
    });
  });

  it("reflects a sanctioned account", async () => {
    const staff = await seedUser(UserStatus.ACTIVE, [
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);
    const suspended = await seedUser(UserStatus.SUSPENDED);

    const history = await getHistory.invoke({
      userId: suspended,
      viewerId: staff,
    });
    expect(history.sanctioned).toBe(true);
    expect(history.adoptions).toBe(0);
  });

  it("refuses a viewer who isn't shelter staff or an operator", async () => {
    const outsider = await seedUser();
    const applicant = await seedUser();

    await expect(
      getHistory.invoke({ userId: applicant, viewerId: outsider }),
    ).rejects.toThrow("보호소 담당자");
  });
});
