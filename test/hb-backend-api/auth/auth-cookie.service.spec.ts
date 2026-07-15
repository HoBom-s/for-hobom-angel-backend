import { ConfigService } from "@nestjs/config";
import { CookieOptions, Response } from "express";
import { AuthCookieService } from "src/hb-backend-api/auth/adapters/in/rest/auth-cookie.service";

const config = (env: Record<string, string | undefined>): ConfigService =>
  ({
    get: (k: string) => env[k],
    getOrThrow: (k: string) => {
      if (env[k] == null) {
        throw new Error(`missing ${k}`);
      }
      return env[k];
    },
  }) as unknown as ConfigService;

const BASE = {
  HOBOM_JWT_ACCESS_TOKEN_EXPIRED: "15m",
  HOBOM_JWT_REFRESH_TOKEN_EXPIRED: "30d",
};

/** Captures the options of the accessToken cookie a set() call produces. */
const secureOf = (env: Record<string, string | undefined>): boolean => {
  const svc = new AuthCookieService(config({ ...BASE, ...env }));
  let opts: CookieOptions = {};
  const res = {
    cookie: (_n: string, _v: string, o: CookieOptions) => {
      opts = o;
    },
  } as unknown as Response;
  svc.set(res, { accessToken: "a", refreshToken: "r" });
  return opts.secure === true;
};

describe("AuthCookieService secure flag", () => {
  it("follows NODE_ENV when COOKIE_SECURE is unset", () => {
    expect(secureOf({ NODE_ENV: "production" })).toBe(true);
    expect(secureOf({ NODE_ENV: "development" })).toBe(false);
  });

  it("COOKIE_SECURE overrides NODE_ENV (dev over http)", () => {
    expect(secureOf({ NODE_ENV: "production", COOKIE_SECURE: "false" })).toBe(
      false,
    );
    expect(secureOf({ NODE_ENV: "development", COOKIE_SECURE: "true" })).toBe(
      true,
    );
  });

  it("maxAge is derived from the token expiry (15m -> 900_000ms)", () => {
    const svc = new AuthCookieService(config(BASE));
    const calls: CookieOptions[] = [];
    const res = {
      cookie: (_n: string, _v: string, o: CookieOptions) => calls.push(o),
    } as unknown as Response;
    svc.set(res, { accessToken: "a", refreshToken: "r" });
    expect(calls[0].maxAge).toBe(900_000);
    expect(calls[1].maxAge).toBe(30 * 86_400_000);
  });
});
