import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { VerifiedIdentity } from "src/hb-backend-api/identity/domain/model/verified-identity";
import { IdentityVerificationPort } from "src/hb-backend-api/identity/domain/ports/out/identity-verification.port";
import { SignUpUseCase } from "src/hb-backend-api/auth/domain/ports/in/sign-up.use-case";
import { LoginUseCase } from "src/hb-backend-api/auth/domain/ports/in/login.use-case";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";

/**
 * Full session lifecycle through the real DI graph + Mongo replica set, with the
 * 본인확인 vendor faked (the token IS the CI, so distinct tokens = distinct
 * people): signup -> login -> refresh(rotate) -> logout(revoke) -> reuse blocked.
 */
class FakeIdentityVerification implements IdentityVerificationPort {
  public verify(verificationToken: string): Promise<VerifiedIdentity> {
    return Promise.resolve(
      VerifiedIdentity.of({
        ci: verificationToken,
        di: `di-${verificationToken}`,
        realName: "홍길동",
        phone: "01012345678",
        verifiedChannel: VerifiedChannel.PHONE,
      }),
    );
  }
}

describe("Auth entry (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let signUp: SignUpUseCase;
  let login: LoginUseCase;
  let refreshTokens: RefreshTokenService;
  let userModel: Model<UserEntity>;

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
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DIToken.IdentityModule.IdentityVerificationPort)
      .useClass(FakeIdentityVerification)
      .compile();

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

  it("signs up a member, encrypting PII and issuing a session", async () => {
    const result = await signUp.invoke({
      verificationToken: "ci-alice",
      nickname: "alice",
      email: "alice@example.com",
    });

    expect(result.userId).toBeDefined();
    expect(result.nickname).toBe("alice");
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();

    const doc = await userModel.findById(result.userId).lean().exec();
    expect(doc?.ci).toBe("ci-alice");
    expect(doc?.realNameEnc).not.toContain("홍길동"); // stored encrypted
    expect(doc?.email).toBe("alice@example.com");
  });

  it("rejects a second signup for the same identity (CI)", async () => {
    await expect(
      signUp.invoke({
        verificationToken: "ci-alice",
        nickname: "alice2",
        email: "alice2@example.com",
      }),
    ).rejects.toThrow("이미 가입된");
  });

  it("logs a returning member in, and refuses an unknown identity", async () => {
    const tokens = await login.invoke({ verificationToken: "ci-alice" });
    expect(tokens.accessToken).toBeTruthy();

    await expect(
      login.invoke({ verificationToken: "ci-nobody" }),
    ).rejects.toThrow("가입이 필요해요");
  });

  it("rotates on refresh and revokes on logout (reuse blocked)", async () => {
    const { tokens } = await signUp.invoke({
      verificationToken: "ci-bob",
      nickname: "bob",
      email: "bob@example.com",
    });

    const rotated = await refreshTokens.rotate(tokens.refreshToken);
    expect(rotated.refreshToken).not.toBe(tokens.refreshToken);

    // Presenting the now-rotated (spent) token again is detected as reuse.
    await expect(refreshTokens.rotate(tokens.refreshToken)).rejects.toThrow();
  });

  it("logout revokes the family so the token can no longer rotate", async () => {
    const { tokens } = await signUp.invoke({
      verificationToken: "ci-carol",
      nickname: "carol",
      email: "carol@example.com",
    });

    await refreshTokens.revoke(tokens.refreshToken);
    await expect(refreshTokens.rotate(tokens.refreshToken)).rejects.toThrow();
  });
});
