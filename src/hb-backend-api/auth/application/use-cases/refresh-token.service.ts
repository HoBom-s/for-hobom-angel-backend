import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { RefreshTokenStatus } from "src/hb-backend-api/auth/domain/enums/refresh-token-status.enum";
import { InvalidRefreshTokenException } from "src/hb-backend-api/auth/domain/exception/invalid-refresh-token.exception";
import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";
import { JwtAuthPort } from "src/hb-backend-api/auth/domain/ports/out/jwt-auth.port";
import { RefreshTokenRepository } from "src/hb-backend-api/auth/domain/repositories/refresh-token.repository";

/**
 * Session lifecycle with **rotating refresh tokens + reuse detection**.
 *
 * Each login starts a token *family*. Every refresh rotates: the presented token
 * is marked ROTATED and a fresh one is issued in the same family. If an already
 * ROTATED token is presented again, that can only mean the token was stolen —
 * the whole family is revoked, logging the attacker (and the victim) out. This
 * is what makes stateless JWTs revocable.
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AuthModule.JwtAuthPort)
    private readonly jwtAuthPort: JwtAuthPort,
    @Inject(DIToken.AuthModule.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /** Start a new session (called by the login flow once the member is resolved). */
  @Transactional()
  public async issue(userId: string, nickname: string): Promise<TokenPair> {
    return this.issueForFamily(userId, nickname, randomUUID());
  }

  /** Rotate the presented refresh token, detecting reuse. */
  @Transactional()
  public async rotate(presentedRefreshToken: string): Promise<TokenPair> {
    const payload = await this.jwtAuthPort.verifyRefreshToken(
      presentedRefreshToken,
    );
    const stored = await this.refreshTokenRepository.findByJti(payload.jti);

    if (!stored || stored.status === RefreshTokenStatus.REVOKED) {
      throw new InvalidRefreshTokenException();
    }
    if (stored.status === RefreshTokenStatus.ROTATED) {
      // Reuse of a spent token — the family is compromised. Burn it all down.
      await this.refreshTokenRepository.revokeFamily(stored.familyId);
      throw new InvalidRefreshTokenException();
    }

    await this.refreshTokenRepository.markRotated(stored.jti);
    return this.issueForFamily(payload.uid, payload.sub, stored.familyId);
  }

  /** Log out: revoke the whole family. Idempotent for an invalid token. */
  @Transactional()
  public async revoke(presentedRefreshToken: string): Promise<void> {
    const payload = await this.jwtAuthPort
      .verifyRefreshToken(presentedRefreshToken)
      .catch(() => null);
    if (payload) {
      await this.refreshTokenRepository.revokeFamily(payload.sid);
    }
  }

  private async issueForFamily(
    userId: string,
    nickname: string,
    familyId: string,
  ): Promise<TokenPair> {
    // `sub` = nickname (gateway X-User-Nickname convention); uid = user id.
    const accessToken = await this.jwtAuthPort.issueAccessToken({
      sub: nickname,
      uid: userId,
    });
    const refresh = await this.jwtAuthPort.issueRefreshToken({
      sub: nickname,
      uid: userId,
      sid: familyId,
    });
    await this.refreshTokenRepository.create({
      jti: refresh.jti,
      familyId,
      userId,
      expiresAt: refresh.expiresAt,
    });
    return { accessToken, refreshToken: refresh.token };
  }
}
