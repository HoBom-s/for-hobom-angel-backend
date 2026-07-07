/**
 * Refresh-token JWT claims. `sid` is the family/session id; `jti` is this token's
 * id (the server tracks it to enforce single-use rotation).
 */
export interface RefreshTokenPayload {
  sub: string;
  uid: string;
  sid: string;
  jti: string;
}
