import "express";

/**
 * Augments Express's `Request.user` with the principal that {@link JwtStrategy}
 * populates, so handlers/guards/interceptors read `req.user.userId` type-safely
 * without casts. Mirrors {@link AuthenticatedUser}.
 */
declare global {
  namespace Express {
    interface User {
      userId: string;
      nickname: string;
    }
  }
}

export {};
