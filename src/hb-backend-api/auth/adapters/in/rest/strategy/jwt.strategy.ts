import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";
import { TokenPayload } from "src/hb-backend-api/auth/domain/model/token-payload";

/**
 * Validates the access token. Extraction order: `accessToken` cookie first
 * (browser SPA), then `Authorization: Bearer` (mirrors the gateway pass-through).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req.cookies as Record<string, string> | undefined)?.accessToken ??
          null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("HOBOM_JWT_SECRET"),
    });
  }

  public validate(payload: TokenPayload): AuthenticatedUser {
    return { userId: payload.uid, nickname: payload.sub };
  }
}
