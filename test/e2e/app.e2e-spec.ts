import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";

/**
 * Boot smoke test: stands up the full AppModule against an in-memory Mongo
 * replica set (transactions require a replica set) and hits the health route.
 * Proves the DI graph resolves, Mongo connects, and `/` answers 200.
 */
describe("App (e2e)", () => {
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
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("GET / returns healthy", async () => {
    const res = await request(app.getHttpServer()).get("/");
    expect(res.status).toBe(200);
  });

  it("exposes liveness and readiness probes", async () => {
    expect(
      (await request(app.getHttpServer()).get("/health/live")).status,
    ).toBe(200);
    expect(
      (await request(app.getHttpServer()).get("/health/ready")).status,
    ).toBe(200);
  });
});
