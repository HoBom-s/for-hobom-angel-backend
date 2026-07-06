import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";
import { TokenPayload } from "src/hb-backend-api/auth/domain/model/token-payload";
import { JwtAuthPort } from "src/hb-backend-api/auth/domain/ports/out/jwt-auth.port";

/**
 * JwtAuthPort implementation. Access token signs with the module-configured
 * primary secret; refresh token signs/verifies with a distinct secret so a
 * leaked access secret cannot mint refresh tokens.
 */
@Injectable()
export class JwtAuthAdapter implements JwtAuthPort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  public async issueTokens(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.expiresIn("HOBOM_JWT_ACCESS_TOKEN_EXPIRED"),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>("HOBOM_JWT_REFRESH_SECRET"),
      expiresIn: this.expiresIn("HOBOM_JWT_REFRESH_TOKEN_EXPIRED"),
    });
    return { accessToken, refreshToken };
  }

  // jsonwebtoken accepts "15m"/"30d" strings at runtime; the typings model
  // expiresIn as a `StringValue` literal union, so a plain env string is cast.
  private expiresIn(key: string): JwtSignOptions["expiresIn"] {
    return this.config.getOrThrow<string>(key) as JwtSignOptions["expiresIn"];
  }

  public verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: this.config.getOrThrow<string>("HOBOM_JWT_REFRESH_SECRET"),
    });
  }

  public verifyRefreshTokenIgnoreExpiry(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: this.config.getOrThrow<string>("HOBOM_JWT_REFRESH_SECRET"),
      ignoreExpiration: true,
    });
  }
}
