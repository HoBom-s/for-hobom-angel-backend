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
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PublishPolicyUseCase } from "src/hb-backend-api/policy/domain/ports/in/publish-policy.use-case";
import { GrantConsentUseCase } from "src/hb-backend-api/consent/domain/ports/in/grant-consent.use-case";
import { WithdrawConsentUseCase } from "src/hb-backend-api/consent/domain/ports/in/withdraw-consent.use-case";
import { ListMyConsentsUseCase } from "src/hb-backend-api/consent/domain/ports/in/list-my-consents.use-case";

/**
 * End-to-end: an operator publishes a policy, a member consents to it, a new
 * version is published (re-consent required), the member re-consents, then
 * withdraws — proving the policy CMS and consent module compose.
 */
describe("Consent (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let publish: PublishPolicyUseCase;
  let grant: GrantConsentUseCase;
  let withdraw: WithdrawConsentUseCase;
  let listMine: ListMyConsentsUseCase;
  let userModel: Model<UserEntity>;
  let adminId: string;
  let memberId: string;

  const seedUser = async (
    nickname: string,
    roles: UserRole[],
  ): Promise<string> => {
    const id = new Types.ObjectId();
    await userModel.create({
      _id: id,
      nickname,
      email: `${nickname}@test.local`,
      passwordHash: "hash",
      realNameEnc: "enc",
      phoneEnc: "enc",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles,
      status: UserStatus.ACTIVE,
    });
    return id.toString();
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

    publish = app.get(DIToken.PolicyModule.PublishPolicyUseCase);
    grant = app.get(DIToken.ConsentModule.GrantConsentUseCase);
    withdraw = app.get(DIToken.ConsentModule.WithdrawConsentUseCase);
    listMine = app.get(DIToken.ConsentModule.ListMyConsentsUseCase);
    userModel = app.get(getModelToken(UserEntity.name));

    adminId = await seedUser("operator", [
      UserRole.USER,
      UserRole.SYSTEM_ADMIN,
    ]);
    memberId = await seedUser("member", [UserRole.USER]);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  const privacyView = async () => {
    const views = await listMine.invoke(memberId);
    return views.find((v) => v.policyType === PolicyType.PRIVACY_POLICY);
  };

  it("consents, detects re-consent on a new version, re-consents, withdraws", async () => {
    await publish.invoke({
      actorId: adminId,
      type: PolicyType.PRIVACY_POLICY,
      title: "처리방침 v1",
      content: "v1",
    });

    await grant.invoke({
      userId: memberId,
      policyType: PolicyType.PRIVACY_POLICY,
      policyVersion: 1,
    });
    expect((await privacyView())?.needsConsent).toBe(false);

    // A new version supersedes → re-consent required.
    await publish.invoke({
      actorId: adminId,
      type: PolicyType.PRIVACY_POLICY,
      title: "처리방침 v2",
      content: "v2",
    });
    const stale = await privacyView();
    expect(stale?.currentVersion).toBe(2);
    expect(stale?.agreedVersion).toBe(1);
    expect(stale?.needsConsent).toBe(true);

    await grant.invoke({
      userId: memberId,
      policyType: PolicyType.PRIVACY_POLICY,
      policyVersion: 2,
    });
    expect((await privacyView())?.needsConsent).toBe(false);

    await withdraw.invoke({
      userId: memberId,
      policyType: PolicyType.PRIVACY_POLICY,
    });
    const withdrawn = await privacyView();
    expect(withdrawn?.status).toBe("WITHDRAWN");
    expect(withdrawn?.needsConsent).toBe(true);
  });
});
