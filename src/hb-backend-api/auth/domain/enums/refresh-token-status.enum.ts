export enum RefreshTokenStatus {
  /** Current, usable token. */
  ACTIVE = "ACTIVE",
  /** Superseded by a rotation — presenting it again means token theft. */
  ROTATED = "ROTATED",
  /** Invalidated (logout, or family compromise). */
  REVOKED = "REVOKED",
}
