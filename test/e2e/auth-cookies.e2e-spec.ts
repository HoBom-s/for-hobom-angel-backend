import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import cookieParser from "cookie-parser";
import { hashSync } from "bcryptjs";
import request from "supertest";
import { ResponseWrapInterceptor } from "src/shared/response/response-wrap.interceptor";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

const PREFIX = "/hobom-angel-backend/api/v1";
const PASSWORD = "s3cret-password";

/**
 * Auth e2e: tokens travel as httpOnly cookies, never in the body. Login sets the
 * cookies; a following request authenticates from the accessToken cookie alone;
 * refresh rotates; logout clears them.
 */
describe("Auth cookies (e2e)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let userModel: Model<UserEntity>;
  let email: string;

  const setCookies = (res: request.Response): string[] =>
    (res.headers["set-cookie"] as unknown as string[]) ?? [];

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

    userModel = app.get(getModelToken(UserEntity.name));

    const id = new Types.ObjectId();
    email = `bom-${id.toHexString()}@example.com`;
    await userModel.create({
      _id: id,
      nickname: `bom-${id.toHexString().slice(-6)}`,
      email,
      passwordHash: hashSync(PASSWORD, 4),
      realNameEnc: "enc",
      phoneEnc: "enc",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles: [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("login sets httpOnly cookies and never returns tokens in the body", async () => {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/login`)
      .send({ email, password: PASSWORD })
      .expect(201);

    const cookies = setCookies(res).join("; ");
    expect(cookies).toContain("accessToken=");
    expect(cookies).toContain("refreshToken=");
    expect(cookies.toLowerCase()).toContain("httponly");

    expect(res.body.items).toEqual({ userId: expect.any(String) });
    expect(JSON.stringify(res.body)).not.toContain("accessToken");
    expect(JSON.stringify(res.body)).not.toContain("eyJ"); // no JWT anywhere
  });

  it("the accessToken cookie authenticates a following request", async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post(`${PREFIX}/auth/login`)
      .send({ email, password: PASSWORD })
      .expect(201);

    // no Authorization header — only the cookie the agent kept
    const me = await agent.get(`${PREFIX}/users/me`).expect(200);
    expect(me.body.items.email).toBe(email);
  });

  it("refresh rotates and logout clears the cookies", async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post(`${PREFIX}/auth/login`)
      .send({ email, password: PASSWORD })
      .expect(201);

    const refreshed = await agent.post(`${PREFIX}/auth/refresh`).expect(204);
    expect(setCookies(refreshed).join("; ")).toContain("refreshToken=");

    const loggedOut = await agent.post(`${PREFIX}/auth/logout`).expect(204);
    // clearing sends the cookie with an immediate expiry
    expect(setCookies(loggedOut).join("; ")).toMatch(
      /Expires=Thu, 01 Jan 1970/,
    );
  });

  it("refresh without a token is unauthorized", async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/refresh`)
      .expect(401);
  });
});
