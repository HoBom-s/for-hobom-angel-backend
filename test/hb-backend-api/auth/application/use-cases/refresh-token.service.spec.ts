import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { RefreshTokenStatus } from "src/hb-backend-api/auth/domain/enums/refresh-token-status.enum";
import { InvalidRefreshTokenException } from "src/hb-backend-api/auth/domain/exception/invalid-refresh-token.exception";
import { JwtAuthPort } from "src/hb-backend-api/auth/domain/ports/out/jwt-auth.port";
import {
  RefreshTokenRepository,
  StoredRefreshToken,
} from "src/hb-backend-api/auth/domain/repositories/refresh-token.repository";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";

describe("RefreshTokenService", () => {
  let jwtAuthPort: jest.Mocked<JwtAuthPort>;
  let repo: jest.Mocked<RefreshTokenRepository>;
  let service: RefreshTokenService;

  const futureExpiry = () => new Date(Date.now() + 60_000);

  beforeEach(() => {
    jwtAuthPort = {
      issueAccessToken: jest.fn().mockResolvedValue("access-token"),
      issueRefreshToken: jest.fn().mockResolvedValue({
        token: "refresh-token",
        jti: "new-jti",
        expiresAt: futureExpiry(),
      }),
      verifyRefreshToken: jest.fn(),
    };
    repo = {
      create: jest.fn(),
      findByJti: jest.fn(),
      markRotated: jest.fn(),
      revokeFamily: jest.fn(),
      deleteByUserId: jest.fn(),
      countByUserId: jest.fn(),
    };
    const txRunner = {
      run: jest.fn((cb: () => Promise<unknown>) => cb()),
    } as unknown as TransactionRunner;
    service = new RefreshTokenService(txRunner, jwtAuthPort, repo);
  });

  it("issue starts a family and persists the token", async () => {
    const pair = await service.issue("user-1", "hobom");

    expect(pair).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(jwtAuthPort.issueAccessToken).toHaveBeenCalledWith({
      sub: "hobom",
      uid: "user-1",
    });
    const created = repo.create.mock.calls[0][0];
    expect(created).toMatchObject({ jti: "new-jti", userId: "user-1" });
    // refresh token is signed for the same family it is stored under
    expect(jwtAuthPort.issueRefreshToken.mock.calls[0][0].sid).toBe(
      created.familyId,
    );
  });

  it("rotate marks the old token rotated and issues a new one in the same family", async () => {
    jwtAuthPort.verifyRefreshToken.mockResolvedValue({
      sub: "hobom",
      uid: "user-1",
      sid: "fam-1",
      jti: "old-jti",
    });
    repo.findByJti.mockResolvedValue(
      StoredRefreshToken.of({
        jti: "old-jti",
        familyId: "fam-1",
        userId: "user-1",
        status: RefreshTokenStatus.ACTIVE,
      }),
    );

    const pair = await service.rotate("presented");

    expect(repo.markRotated).toHaveBeenCalledWith("old-jti");
    expect(jwtAuthPort.issueRefreshToken.mock.calls[0][0].sid).toBe("fam-1");
    expect(pair.refreshToken).toBe("refresh-token");
    expect(repo.revokeFamily).not.toHaveBeenCalled();
  });

  it("detects reuse of a rotated token and revokes the whole family", async () => {
    jwtAuthPort.verifyRefreshToken.mockResolvedValue({
      sub: "hobom",
      uid: "user-1",
      sid: "fam-1",
      jti: "spent",
    });
    repo.findByJti.mockResolvedValue(
      StoredRefreshToken.of({
        jti: "spent",
        familyId: "fam-1",
        userId: "user-1",
        status: RefreshTokenStatus.ROTATED,
      }),
    );

    await expect(service.rotate("presented")).rejects.toThrow(
      InvalidRefreshTokenException,
    );
    expect(repo.revokeFamily).toHaveBeenCalledWith("fam-1");
    expect(repo.markRotated).not.toHaveBeenCalled();
  });

  it("rejects an unknown or revoked token without issuing", async () => {
    jwtAuthPort.verifyRefreshToken.mockResolvedValue({
      sub: "n",
      uid: "u",
      sid: "f",
      jti: "x",
    });

    repo.findByJti.mockResolvedValueOnce(null);
    await expect(service.rotate("p")).rejects.toThrow(
      InvalidRefreshTokenException,
    );

    repo.findByJti.mockResolvedValueOnce(
      StoredRefreshToken.of({
        jti: "x",
        familyId: "f",
        userId: "u",
        status: RefreshTokenStatus.REVOKED,
      }),
    );
    await expect(service.rotate("p")).rejects.toThrow(
      InvalidRefreshTokenException,
    );
    expect(repo.revokeFamily).not.toHaveBeenCalled();
  });

  it("revoke logs out by revoking the family; invalid token is a no-op", async () => {
    jwtAuthPort.verifyRefreshToken.mockResolvedValueOnce({
      sub: "n",
      uid: "u",
      sid: "fam-9",
      jti: "j",
    });
    await service.revoke("p");
    expect(repo.revokeFamily).toHaveBeenCalledWith("fam-9");

    jwtAuthPort.verifyRefreshToken.mockRejectedValueOnce(new Error("bad"));
    await expect(service.revoke("p")).resolves.toBeUndefined();
    expect(repo.revokeFamily).toHaveBeenCalledTimes(1);
  });
});
