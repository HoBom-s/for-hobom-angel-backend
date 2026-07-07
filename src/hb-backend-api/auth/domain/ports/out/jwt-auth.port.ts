import { RefreshTokenPayload } from "src/hb-backend-api/auth/domain/model/refresh-token-payload";
import { TokenPayload } from "src/hb-backend-api/auth/domain/model/token-payload";

export interface IssuedRefreshToken {
  token: string;
  jti: string;
  expiresAt: Date;
}

/**
 * Angel issues and verifies its own tokens. Access token uses the primary
 * secret; refresh token uses a separate secret and carries a session (`sid`) and
 * token (`jti`) id so the store can enforce single-use rotation.
 */
export interface JwtAuthPort {
  issueAccessToken(payload: TokenPayload): Promise<string>;
  issueRefreshToken(input: {
    sub: string;
    uid: string;
    sid: string;
  }): Promise<IssuedRefreshToken>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
