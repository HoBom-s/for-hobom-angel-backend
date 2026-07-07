import { RefreshTokenStatus } from "src/hb-backend-api/auth/domain/enums/refresh-token-status.enum";

export interface CreateRefreshToken {
  jti: string;
  familyId: string;
  userId: string;
  expiresAt: Date;
}

export interface StoredRefreshToken {
  jti: string;
  familyId: string;
  userId: string;
  status: RefreshTokenStatus;
}

/** Persistence contract over the refresh_tokens collection. */
export interface RefreshTokenRepository {
  create(token: CreateRefreshToken): Promise<void>;
  findByJti(jti: string): Promise<StoredRefreshToken | null>;
  markRotated(jti: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
}
