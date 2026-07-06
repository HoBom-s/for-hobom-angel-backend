export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Request-scoped principal set by {@link JwtStrategy} after authentication. */
export interface AuthenticatedUser {
  userId: string;
  nickname: string;
}
