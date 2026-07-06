import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";
import { TokenPayload } from "src/hb-backend-api/auth/domain/model/token-payload";

/**
 * Angel issues and verifies its own tokens (the gateway does not own users).
 * Access token uses the primary secret; refresh token uses a
 * separate secret + longer TTL.
 */
export interface JwtAuthPort {
  issueTokens(payload: TokenPayload): Promise<TokenPair>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  verifyRefreshTokenIgnoreExpiry(token: string): Promise<TokenPayload>;
}
