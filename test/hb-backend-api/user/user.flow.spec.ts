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
import { ChangeNicknameUseCase } from "src/hb-backend-api/user/domain/ports/in/change-nickname.use-case";
import { WithdrawAccountUseCase } from "src/hb-backend-api/user/domain/ports/in/withdraw-account.use-case";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/**
 * End-to-end profile slice through the real DI graph + a Mongo transaction:
 * a member renames themselves (unique-guarded) and withdraws (soft-delete with
 * a purge deadline), driven by the in-port use-cases and the query port.
 */
describe("User profile (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let changeNickname: ChangeNicknameUseCase;
  let withdraw: WithdrawAccountUseCase;
  let userQuery: UserQueryPort;
  let userModel: Model<UserEntity>;

  let seq = 0;
  const seedUser = async (nickname: string): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname,
      realNameEnc: "enc",
      ci: `ci-${id.toHexString()}`,
      phoneEnc: "enc",
      email: `u${seq}@example.com`,
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
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

    changeNickname = app.get(DIToken.UserModule.ChangeNicknameUseCase);
    withdraw = app.get(DIToken.UserModule.WithdrawAccountUseCase);
    userQuery = app.get(DIToken.UserModule.UserQueryPort);
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("renames a member and persists the new nickname", async () => {
    const id = await seedUser("oldname");

    await changeNickname.invoke({ userId: id, nickname: "brandnew" });

    const doc = await userModel.findById(id).lean().exec();
    expect(doc?.nickname).toBe("brandnew");
    expect(doc?.version).toBe(1);
  });

  it("rejects a nickname already held by another member", async () => {
    await seedUser("taken");
    const id = await seedUser("mine");

    await expect(
      changeNickname.invoke({ userId: id, nickname: "taken" }),
    ).rejects.toThrow("이미 사용 중인");
  });

  it("soft-withdraws with a purge deadline and blocks further changes", async () => {
    const id = await seedUser("leaving");

    await withdraw.invoke({ userId: id });

    const doc = await userModel.findById(id).lean().exec();
    expect(doc?.status).toBe(UserStatus.WITHDRAWN);
    expect(doc?.withdrawnAt).toBeInstanceOf(Date);
    expect(doc?.purgeAfter?.getTime()).toBeGreaterThan(
      doc!.withdrawnAt!.getTime(),
    );

    const reloaded = await userQuery.findById(UserId.fromString(id));
    expect(reloaded?.isActive()).toBe(false);
    await expect(
      changeNickname.invoke({ userId: id, nickname: "afterleave" }),
    ).rejects.toThrow("활성 상태");
  });
});
