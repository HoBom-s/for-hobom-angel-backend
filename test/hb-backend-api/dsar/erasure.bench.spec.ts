import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { ERASED_PII } from "src/hb-backend-api/user/domain/model/personal-data";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { RefreshTokenStatus } from "src/hb-backend-api/auth/domain/enums/refresh-token-status.enum";
import { RefreshTokenEntity } from "src/hb-backend-api/auth/domain/model/refresh-token.entity";
import { ErasureWorker } from "src/hb-backend-api/dsar/schedule/erasure.worker";

/**
 * Load/throughput bench for the daily erasure sweep — also an end-to-end
 * integration test (real DI graph + real Mongo transactions). Seeds N withdrawn
 * accounts past their grace, runs the worker once, and asserts the whole backlog
 * was anonymized (proving the loop drains beyond the old 200 cap). Absolute
 * timings on an in-memory replica set are NOT production-representative — they
 * are for relative regression and per-account overhead only.
 */
describe("ErasureWorker throughput (bench)", () => {
  const N = 300;

  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let worker: ErasureWorker;
  let userModel: Model<UserEntity>;
  let refreshTokenModel: Model<RefreshTokenEntity>;
  const seededIds: Types.ObjectId[] = [];

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

    worker = app.get(ErasureWorker, { strict: false });
    userModel = app.get(getModelToken(UserEntity.name));
    refreshTokenModel = app.get(getModelToken(RefreshTokenEntity.name));

    const yesterday = new Date(Date.now() - 86_400_000);
    const users = Array.from({ length: N }, (_, i) => {
      const id = new Types.ObjectId();
      seededIds.push(id);
      return {
        _id: id,
        nickname: `purge-me-${i}`,
        email: `purge-me-${i}@test.local`,
        passwordHash: "hash",
        realNameEnc: `enc-name-${i}`,
        phoneEnc: `enc-phone-${i}`,
        verifiedChannel: VerifiedChannel.EMAIL,
        roles: [UserRole.USER],
        shelterRoles: [],
        status: UserStatus.WITHDRAWN,
        purgeAfter: yesterday,
      };
    });
    await userModel.insertMany(users);
    await refreshTokenModel.insertMany(
      seededIds.map((id, i) => ({
        jti: `jti-${i}`,
        familyId: `fam-${i}`,
        userId: id.toString(),
        status: RefreshTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86_400_000),
      })),
    );
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it(`drains ${N} withdrawn accounts and anonymizes every one`, async () => {
    const startedAt = Date.now();
    await worker.handle();
    const elapsedMs = Date.now() - startedAt;

    const unpurged = await userModel.countDocuments({
      _id: { $in: seededIds },
      realNameEnc: { $ne: ERASED_PII },
    });
    const remainingTokens = await refreshTokenModel.countDocuments({
      userId: { $in: seededIds.map((id) => id.toString()) },
    });

    // Correctness: the whole backlog erased (loop drained past the old 200 cap).
    expect(unpurged).toBe(0);
    expect(remainingTokens).toBe(0);

    // Throughput (informational — in-memory, not production-representative).
    const perAccount = (elapsedMs / N).toFixed(2);
    const perSec = Math.round((N / elapsedMs) * 1000);
    console.log(
      `[erasure bench] ${N} accounts in ${elapsedMs}ms — ${perAccount}ms/account, ~${perSec}/s`,
    );
  }, 120_000);
});
