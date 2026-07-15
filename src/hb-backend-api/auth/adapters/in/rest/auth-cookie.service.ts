import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CookieOptions, Response } from "express";
import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

/** "15m" / "30d" / "3600s" -> milliseconds. */
function durationToMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }
  const n = Number(match[1]);
  const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return n * (unit ?? 0);
}

/**
 * Puts the token pair in httpOnly cookies so no token ever reaches JavaScript
 * (XSS-safe). The gateway forwards these Set-Cookie headers to the browser, and
 * on later requests turns the `accessToken` cookie into a Bearer header for us.
 *
 * `secure` (HTTPS-only cookie) defaults to on in production but is overridable
 * with `COOKIE_SECURE` — a dev backend on http://localhost must set it false, or
 * the browser drops the Secure cookie. No `domain` is set, so the cookie is
 * host-only, bound to the gateway's public domain (keep FE + API same-site so
 * webviews don't drop it). `SameSite=Lax` blocks the common CSRF vectors.
 */
@Injectable()
export class AuthCookieService {
  private readonly secure: boolean;
  private readonly accessMaxAge: number;
  private readonly refreshMaxAge: number;

  constructor(config: ConfigService) {
    // COOKIE_SECURE overrides the NODE_ENV default so dev-over-http can force it off.
    const explicit = config.get<string>("COOKIE_SECURE");
    this.secure =
      explicit != null
        ? explicit === "true"
        : config.get<string>("NODE_ENV") === "production";
    this.accessMaxAge = durationToMs(
      config.getOrThrow<string>("HOBOM_JWT_ACCESS_TOKEN_EXPIRED"),
    );
    this.refreshMaxAge = durationToMs(
      config.getOrThrow<string>("HOBOM_JWT_REFRESH_TOKEN_EXPIRED"),
    );
  }

  private base(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: "lax",
      path: "/",
      maxAge,
    };
  }

  public set(res: Response, tokens: TokenPair): void {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, this.base(this.accessMaxAge));
    res.cookie(
      REFRESH_COOKIE,
      tokens.refreshToken,
      this.base(this.refreshMaxAge),
    );
  }

  public clear(res: Response): void {
    const opts: CookieOptions = {
      httpOnly: true,
      secure: this.secure,
      sameSite: "lax",
      path: "/",
    };
    res.clearCookie(ACCESS_COOKIE, opts);
    res.clearCookie(REFRESH_COOKIE, opts);
  }
}
