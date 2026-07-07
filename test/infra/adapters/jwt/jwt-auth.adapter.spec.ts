import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthAdapter } from "src/infra/adapters/jwt/jwt-auth.adapter";

const env: Record<string, string> = {
  HOBOM_JWT_SECRET: "access-secret",
  HOBOM_JWT_REFRESH_SECRET: "refresh-secret",
  HOBOM_JWT_ACCESS_TOKEN_EXPIRED: "15m",
  HOBOM_JWT_REFRESH_TOKEN_EXPIRED: "30d",
};

const config = {
  getOrThrow: (key: string) => env[key],
} as unknown as ConfigService;

describe("JwtAuthAdapter", () => {
  const jwt = new JwtService({ secret: env.HOBOM_JWT_SECRET });
  const adapter = new JwtAuthAdapter(jwt, config);

  it("issues an access token", async () => {
    expect(await adapter.issueAccessToken({ sub: "hobom", uid: "u1" })).toEqual(
      expect.any(String),
    );
  });

  it("issues a refresh token with a jti and future expiry", async () => {
    const issued = await adapter.issueRefreshToken({
      sub: "hobom",
      uid: "u1",
      sid: "family-1",
    });
    expect(issued.token).toEqual(expect.any(String));
    expect(issued.jti).toEqual(expect.any(String));
    expect(issued.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("verifies a refresh token round-trip (sub/uid/sid/jti)", async () => {
    const issued = await adapter.issueRefreshToken({
      sub: "hobom",
      uid: "u1",
      sid: "family-1",
    });
    const payload = await adapter.verifyRefreshToken(issued.token);
    expect(payload).toMatchObject({
      sub: "hobom",
      uid: "u1",
      sid: "family-1",
      jti: issued.jti,
    });
  });

  it("rejects a token signed with the wrong secret", async () => {
    const accessToken = await adapter.issueAccessToken({ sub: "n", uid: "u" });
    await expect(adapter.verifyRefreshToken(accessToken)).rejects.toThrow();
  });
});
