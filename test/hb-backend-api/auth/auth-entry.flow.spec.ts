import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { SignUpUseCase } from "src/hb-backend-api/auth/domain/ports/in/sign-up.use-case";
import { LoginUseCase } from "src/hb-backend-api/auth/domain/ports/in/login.use-case";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";

/**
 * Full email+password session lifecycle through the real DI graph + Mongo
 * replica set: signup (bcrypt-hashed, PII encrypted) -> login (right/wrong
 * password) -> refresh(rotate) -> reuse detected.
 */
describe("Auth entry (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let signUp: SignUpUseCase;
  let login: LoginUseCase;
  let refreshTokens: RefreshTokenService;
  let userModel: Model<UserEntity>;

  const account = (over: Partial<Record<string, string>> = {}) => ({
    email: "alice@example.com",
    password: "s3cret-password",
    nickname: "alice",
    realName: "홍길동",
    phone: "01012345678",
    ...over,
  });

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

    signUp = app.get(DIToken.AuthModule.SignUpUseCase);
    login = app.get(DIToken.AuthModule.LoginUseCase);
    refreshTokens = app.get(RefreshTokenService);
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("signs up a member, hashing the password and encrypting PII", async () => {
    const result = await signUp.invoke(account());

    expect(result.userId).toBeDefined();
    expect(result.nickname).toBe("alice");
    expect(result.tokens.accessToken).toBeTruthy();

    const doc = await userModel.findById(result.userId).lean().exec();
    expect(doc?.email).toBe("alice@example.com");
    expect(doc?.passwordHash).not.toBe("s3cret-password"); // hashed
    expect(doc?.passwordHash.startsWith("$2")).toBe(true); // bcrypt
    expect(doc?.realNameEnc).not.toContain("홍길동"); // encrypted
  });

  it("rejects a duplicate email and a duplicate nickname", async () => {
    await expect(
      signUp.invoke(account({ nickname: "alice-two" })),
    ).rejects.toThrow("이미 가입된 이메일");
    await expect(
      signUp.invoke(account({ email: "other@example.com" })),
    ).rejects.toThrow("이미 사용 중인 닉네임");
  });

  it("logs in with the right password and refuses the wrong one", async () => {
    const { userId, tokens } = await login.invoke({
      email: "alice@example.com",
      password: "s3cret-password",
    });
    expect(userId).toBeDefined();
    expect(tokens.accessToken).toBeTruthy();

    await expect(
      login.invoke({ email: "alice@example.com", password: "wrong" }),
    ).rejects.toThrow("이메일 또는 비밀번호");
    await expect(
      login.invoke({ email: "nobody@example.com", password: "whatever" }),
    ).rejects.toThrow("이메일 또는 비밀번호");
  });

  it("is case-insensitive on the login email", async () => {
    const { tokens } = await login.invoke({
      email: "ALICE@example.com",
      password: "s3cret-password",
    });
    expect(tokens.accessToken).toBeTruthy();
  });

  it("rotates on refresh and detects reuse of a spent token", async () => {
    const { tokens } = await signUp.invoke(
      account({ email: "bob@example.com", nickname: "bob" }),
    );

    const rotated = await refreshTokens.rotate(tokens.refreshToken);
    expect(rotated.refreshToken).not.toBe(tokens.refreshToken);

    await expect(refreshTokens.rotate(tokens.refreshToken)).rejects.toThrow();
  });
});
