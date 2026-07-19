import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import cookieParser from "cookie-parser";
import request from "supertest";
import { ResponseWrapInterceptor } from "src/shared/response/response-wrap.interceptor";
import { ThrottleConfig } from "src/shared/throttle/throttle.config";

const PREFIX = "/hobom-angel-backend/api/v1";

/**
 * Rate limiting is enforced (a global ThrottlerGuard). Auth is capped tighter
 * (10/min) as the brute-force target; health probes opt out via @SkipThrottle.
 */
describe("Rate limiting (e2e)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;

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
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseWrapInterceptor());
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("429s once /auth/login exceeds the 10/min limit", async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post(`${PREFIX}/auth/login`)
        .send({ email: "nobody@example.com", password: "wrong-password" });

    const limit = ThrottleConfig.authLimit;
    const statuses: number[] = [];
    for (let i = 0; i < limit + 1; i += 1) {
      statuses.push((await attempt()).status);
    }

    // The first `limit` are handled (401 bad creds); the next is throttled.
    expect(statuses.slice(0, limit).every((s) => s !== 429)).toBe(true);
    expect(statuses[limit]).toBe(429);
  });

  it("never throttles health probes (they opt out)", async () => {
    // Health lives at the root, without the API prefix.
    const statuses: number[] = [];
    for (let i = 0; i < 15; i += 1) {
      statuses.push(
        (await request(app.getHttpServer()).get("/health/live")).status,
      );
    }
    expect(statuses.every((s) => s === 200)).toBe(true);
  });
});
