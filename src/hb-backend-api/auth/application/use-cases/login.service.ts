import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { IdentityVerificationPort } from "src/hb-backend-api/identity/domain/ports/out/identity-verification.port";
import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";
import {
  LoginCommand,
  LoginUseCase,
} from "src/hb-backend-api/auth/domain/ports/in/login.use-case";

/**
 * Authenticates a returning member: verify 본인확인, resolve the account by its
 * attested CI, then open a session. Not @Transactional — it only reads before
 * delegating to {@link RefreshTokenService.issue}, which owns its transaction.
 */
@Injectable()
export class LoginService implements LoginUseCase {
  constructor(
    @Inject(DIToken.IdentityModule.IdentityVerificationPort)
    private readonly identityVerificationPort: IdentityVerificationPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  public async invoke(command: LoginCommand): Promise<TokenPair> {
    const identity = await this.identityVerificationPort.verify(
      command.verificationToken,
    );

    const user = await this.userQueryPort.findByCi(identity.getCi);
    if (!user) {
      throw new NotFoundException("가입이 필요해요.");
    }
    if (!user.isActive()) {
      throw new ForbiddenException("이용할 수 없는 계정이에요.");
    }

    return this.refreshTokenService.issue(
      user.getId.toString(),
      user.getNickname.raw,
    );
  }
}
