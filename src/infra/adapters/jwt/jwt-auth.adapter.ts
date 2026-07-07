import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { randomUUID } from "crypto";
import { RefreshTokenPayload } from "src/hb-backend-api/auth/domain/model/refresh-token-payload";
import { TokenPayload } from "src/hb-backend-api/auth/domain/model/token-payload";
import {
  IssuedRefreshToken,
  JwtAuthPort,
} from "src/hb-backend-api/auth/domain/ports/out/jwt-auth.port";

/**
 * JwtAuthPort implementation. Access token signs with the module-configured
 * primary secret; refresh token signs/verifies with a distinct secret and gets a
 * fresh `jti` per issuance so the store can track single use.
 */
@Injectable()
export class JwtAuthAdapter implements JwtAuthPort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  public issueAccessToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.expiresIn("HOBOM_JWT_ACCESS_TOKEN_EXPIRED"),
    });
  }

  public async issueRefreshToken(input: {
    sub: string;
    uid: string;
    sid: string;
  }): Promise<IssuedRefreshToken> {
    const jti = randomUUID();
    const token = await this.jwtService.signAsync(
      { sub: input.sub, uid: input.uid, sid: input.sid, jti },
      {
        secret: this.config.getOrThrow<string>("HOBOM_JWT_REFRESH_SECRET"),
        expiresIn: this.expiresIn("HOBOM_JWT_REFRESH_TOKEN_EXPIRED"),
      },
    );
    const decoded = this.jwtService.decode(token);
    return { token, jti, expiresAt: new Date(decoded.exp * 1000) };
  }

  public verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.config.getOrThrow<string>("HOBOM_JWT_REFRESH_SECRET"),
    });
  }

  // jsonwebtoken accepts "15m"/"30d" strings at runtime; the typings model
  // expiresIn as a `StringValue` literal union, so a plain env string is cast.
  private expiresIn(key: string): JwtSignOptions["expiresIn"] {
    return this.config.getOrThrow<string>(key) as JwtSignOptions["expiresIn"];
  }
}
