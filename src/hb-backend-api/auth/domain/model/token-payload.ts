/**
 * JWT claims. `sub` holds the NICKNAME by convention — the gateway base64-decodes
 * the JWT and injects `X-User-Nickname` from `sub` without verifying the
 * signature. `uid` carries the stable user id for internal use.
 */
export interface TokenPayload {
  sub: string;
  uid: string;
}
