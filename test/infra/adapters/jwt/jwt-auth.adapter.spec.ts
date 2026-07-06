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

  it("issues an access/refresh pair and verifies the refresh token", async () => {
    const { accessToken, refreshToken } = await adapter.issueTokens({
      sub: "hobom",
      uid: "u1",
    });
    expect(accessToken).toEqual(expect.any(String));

    const payload = await adapter.verifyRefreshToken(refreshToken);
    expect(payload).toMatchObject({ sub: "hobom", uid: "u1" });
  });

  it("rejects a refresh token signed with the wrong secret", async () => {
    const { accessToken } = await adapter.issueTokens({ sub: "n", uid: "u" });
    // access token uses a different secret than the refresh verifier
    await expect(adapter.verifyRefreshToken(accessToken)).rejects.toThrow();
  });

  it("can verify a refresh token ignoring expiry", async () => {
    const { refreshToken } = await adapter.issueTokens({ sub: "n", uid: "u" });
    await expect(
      adapter.verifyRefreshTokenIgnoreExpiry(refreshToken),
    ).resolves.toMatchObject({ sub: "n" });
  });
});
