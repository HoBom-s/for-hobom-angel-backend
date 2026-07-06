import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";
import { IssueTokenUseCase } from "src/hb-backend-api/auth/domain/ports/in/issue-token.use-case";
import { JwtAuthPort } from "src/hb-backend-api/auth/domain/ports/out/jwt-auth.port";

@Injectable()
export class IssueTokenService implements IssueTokenUseCase {
  constructor(
    @Inject(DIToken.AuthModule.JwtAuthPort)
    private readonly jwtAuthPort: JwtAuthPort,
  ) {}

  public invoke(userId: string, nickname: string): Promise<TokenPair> {
    // `sub` = nickname (gateway X-User-Nickname convention); uid = user id.
    return this.jwtAuthPort.issueTokens({ sub: nickname, uid: userId });
  }
}
