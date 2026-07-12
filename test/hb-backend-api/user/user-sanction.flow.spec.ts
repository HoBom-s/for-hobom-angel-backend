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
import { SanctionUserUseCase } from "src/hb-backend-api/user/domain/ports/in/sanction-user.use-case";
import { ReinstateUserUseCase } from "src/hb-backend-api/user/domain/ports/in/reinstate-user.use-case";

/**
 * End-to-end report-enforcement slice: an operator suspends a member (blocking
 * them everywhere via isActive()), then reinstates them. Non-operators, and
 * sanctioning an operator, are refused.
 */
describe("User sanction (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let sanction: SanctionUserUseCase;
  let reinstate: ReinstateUserUseCase;
  let userModel: Model<UserEntity>;

  let seq = 0;
  const seedUser = async (
    roles: UserRole[] = [UserRole.USER],
  ): Promise<string> => {
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

    sanction = app.get(DIToken.UserModule.SanctionUserUseCase);
    reinstate = app.get(DIToken.UserModule.ReinstateUserUseCase);
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("an operator suspends then reinstates a member", async () => {
    const admin = await seedUser([UserRole.USER, UserRole.SYSTEM_ADMIN]);
    const member = await seedUser();

    await sanction.invoke({
      userId: member,
      actorId: admin,
      reason: "악성 신고 다수",
    });
    let doc = await userModel.findById(member).lean().exec();
    expect(doc?.status).toBe(UserStatus.SUSPENDED);
    expect(doc?.sanctionReason).toBe("악성 신고 다수");
    expect(doc?.suspendedAt).toBeInstanceOf(Date);

    await reinstate.invoke({ userId: member, actorId: admin });
    doc = await userModel.findById(member).lean().exec();
    expect(doc?.status).toBe(UserStatus.ACTIVE);
    expect(doc?.sanctionReason ?? null).toBeNull();
    expect(doc?.suspendedAt ?? null).toBeNull();
  });

  it("refuses a non-operator", async () => {
    const outsider = await seedUser();
    const member = await seedUser();
    await expect(
      sanction.invoke({ userId: member, actorId: outsider, reason: "임의" }),
    ).rejects.toThrow("운영자");
  });

  it("refuses to sanction an operator", async () => {
    const admin = await seedUser([UserRole.USER, UserRole.SYSTEM_ADMIN]);
    const otherAdmin = await seedUser([UserRole.USER, UserRole.SYSTEM_ADMIN]);
    await expect(
      sanction.invoke({ userId: otherAdmin, actorId: admin, reason: "안돼" }),
    ).rejects.toThrow("운영자는 제재할 수 없어요");
  });
});
