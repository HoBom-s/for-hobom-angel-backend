import { SetMetadata } from "@nestjs/common";

/** Metadata key marking a route as public (no authentication required). */
export const IS_PUBLIC_KEY = "isPublic";

/**
 * Marks a route as public so {@link JwtAuthGuard} skips authentication for it —
 * used to expose specific reads (e.g. the shelter directory / about page) on a
 * controller that otherwise requires a token. Rate limiting still applies.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
