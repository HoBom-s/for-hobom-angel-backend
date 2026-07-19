const ONE_MINUTE_MS = 60_000;

/**
 * Rate-limit configuration (per client IP). Centralized so the window/limits
 * aren't magic numbers scattered across the module and controllers.
 *  - `globalLimit` applies to every HTTP route by default.
 *  - `authLimit` is the tighter cap on /auth/* (the brute-force target).
 */
export const ThrottleConfig = {
  windowMs: ONE_MINUTE_MS,
  globalLimit: 100,
  authLimit: 10,
} as const;
