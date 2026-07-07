import { RefreshTokenStatus } from "src/hb-backend-api/auth/domain/enums/refresh-token-status.enum";

export interface CreateRefreshToken {
  jti: string;
  familyId: string;
  userId: string;
  expiresAt: Date;
}

/**
 * A loaded refresh-token record. Exposes status as predicate methods so callers
 * ask `isRotated()` rather than comparing the enum — the rotation/reuse rules
 * read from the state, not from a scattered `=== ROTATED`.
 */
export class StoredRefreshToken {
  constructor(
    public readonly jti: string,
    public readonly familyId: string,
    public readonly userId: string,
    private readonly status: RefreshTokenStatus,
  ) {}

  public static of(params: {
    jti: string;
    familyId: string;
    userId: string;
    status: RefreshTokenStatus;
  }): StoredRefreshToken {
    return new StoredRefreshToken(
      params.jti,
      params.familyId,
      params.userId,
      params.status,
    );
  }

  public isActive(): boolean {
    return this.status === RefreshTokenStatus.ACTIVE;
  }

  public isRotated(): boolean {
    return this.status === RefreshTokenStatus.ROTATED;
  }

  public isRevoked(): boolean {
    return this.status === RefreshTokenStatus.REVOKED;
  }
}

/** Persistence contract over the refresh_tokens collection. */
export interface RefreshTokenRepository {
  create(token: CreateRefreshToken): Promise<void>;
  findByJti(jti: string): Promise<StoredRefreshToken | null>;
  markRotated(jti: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
}
