import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Rate-limits by the real client IP. The app sits behind hobom-api-gateway, so
 * the socket IP is the gateway's — without this every user would share a single
 * bucket and one busy client could throttle everyone. Trusts the first hop of
 * `X-Forwarded-For` (the gateway is the only ingress), falling back to `req.ip`
 * for direct/local access.
 *
 * This is defense-in-depth: the gateway also rate-limits, but the config here was
 * previously dead (ThrottlerModule was set up but no guard was registered), so
 * there was no app-level limiting at all.
 */
@Injectable()
export class HobomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const headers = req.headers as
      Record<string, string | string[] | undefined> | undefined;
    const forwarded = headers?.["x-forwarded-for"];
    const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ?.split(",")[0]
      ?.trim();
    return Promise.resolve(clientIp || (req.ip as string) || "unknown");
  }
}
