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
import { PolicyStatus } from "src/hb-backend-api/policy/domain/enums/policy-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocumentEntity } from "src/hb-backend-api/policy/domain/model/policy-document.entity";
import { PublishPolicyUseCase } from "src/hb-backend-api/policy/domain/ports/in/publish-policy.use-case";
import { GetCurrentPolicyUseCase } from "src/hb-backend-api/policy/domain/ports/in/get-current-policy.use-case";
import { ListPolicyVersionsUseCase } from "src/hb-backend-api/policy/domain/ports/in/list-policy-versions.use-case";

/**
 * End-to-end: an operator publishes two versions of the privacy policy; the
 * public read always returns the one in effect, and publishing a new version
 * archives the prior — exactly one PUBLISHED per type.
 */
describe("Policy CMS (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let publish: PublishPolicyUseCase;
  let getCurrent: GetCurrentPolicyUseCase;
  let listVersions: ListPolicyVersionsUseCase;
  let userModel: Model<UserEntity>;
  let policyModel: Model<PolicyDocumentEntity>;
  let adminId: string;

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
    getCurrent = app.get(DIToken.PolicyModule.GetCurrentPolicyUseCase);
    listVersions = app.get(DIToken.PolicyModule.ListPolicyVersionsUseCase);
    userModel = app.get(getModelToken(UserEntity.name));
    policyModel = app.get(getModelToken(PolicyDocumentEntity.name));

    const id = new Types.ObjectId();
    adminId = id.toString();
    await userModel.create({
      _id: id,
      nickname: "operator",
      email: "op@test.local",
      passwordHash: "hash",
      realNameEnc: "enc",
      phoneEnc: "enc",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER, UserRole.SYSTEM_ADMIN],
      status: UserStatus.ACTIVE,
    });
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("publishes, serves, re-publishes (archiving the prior), and lists history", async () => {
    const v1 = await publish.invoke({
      actorId: adminId,
      type: PolicyType.PRIVACY_POLICY,
      title: "개인정보 처리방침 v1",
      content: "v1 본문",
    });
    expect(v1.getVersion).toBe(1);

    let current = await getCurrent.invoke(PolicyType.PRIVACY_POLICY);
    expect(current.getVersion).toBe(1);

    const v2 = await publish.invoke({
      actorId: adminId,
      type: PolicyType.PRIVACY_POLICY,
      title: "개인정보 처리방침 v2",
      content: "v2 본문",
    });
    expect(v2.getVersion).toBe(2);

    current = await getCurrent.invoke(PolicyType.PRIVACY_POLICY);
    expect(current.getVersion).toBe(2);
    expect(current.getStatus).toBe(PolicyStatus.PUBLISHED);

    // Exactly one PUBLISHED version per type.
    const published = await policyModel.countDocuments({
      type: PolicyType.PRIVACY_POLICY,
      status: PolicyStatus.PUBLISHED,
    });
    expect(published).toBe(1);

    const history = await listVersions.invoke({
      actorId: adminId,
      type: PolicyType.PRIVACY_POLICY,
    });
    expect(history.map((d) => d.getVersion)).toEqual([2, 1]);
    expect(history[1].getStatus).toBe(PolicyStatus.ARCHIVED);
  });
});
