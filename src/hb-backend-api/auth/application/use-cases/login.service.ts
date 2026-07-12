import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { PasswordHasher } from "src/shared/crypto/password-hasher";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";
import {
  LoginCommand,
  LoginUseCase,
} from "src/hb-backend-api/auth/domain/ports/in/login.use-case";
import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";

/**
 * Authenticates by email + password. A wrong email and a wrong password return
 * the SAME error (no user enumeration). Not @Transactional — it only reads
 * before delegating to {@link RefreshTokenService.issue}, which owns its
 * transaction.
 */
@Injectable()
export class LoginService implements LoginUseCase {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  public async invoke(command: LoginCommand): Promise<TokenPair> {
    // Normalize the same way signup stored it (Email VO lowercases/trims).
    const user = await this.userQueryPort.findByEmail(
      Email.of(command.email).raw,
    );
    const matches =
      user !== null &&
      (await this.passwordHasher.compare(
        command.password,
        user.getPasswordHash,
      ));
    if (!user || !matches) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 올바르지 않아요.",
      );
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
