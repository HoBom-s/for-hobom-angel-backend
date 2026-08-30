/**
 * The request-scoped principal set on `request.user` by the JWT strategy after
 * authentication. This is the app-wide "who is calling" contract every guarded
 * controller reads, so it lives in the shared platform layer rather than inside
 * the auth feature.
 */
export interface AuthenticatedUser {
  userId: string;
  nickname: string;
}
