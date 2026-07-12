import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { PasswordHasher } from "src/shared/crypto/password-hasher";
import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";
import {
  SignUpCommand,
  SignUpResult,
  SignUpUseCase,
} from "src/hb-backend-api/auth/domain/ports/in/sign-up.use-case";

/**
 * Registers a new member from the signup funnel and opens a session:
 *  1. reject if the email or nickname is already taken,
 *  2. hash the password (bcrypt) and create the user (PII encrypted),
 *  3. issue a token pair.
 * Email is the login identity and the uniqueness guard; the check here gives a
 * clean 409, backed by the unique index.
 *
 * Not @Transactional: the user insert is a single atomic write and
 * {@link RefreshTokenService.issue} owns its transaction — nesting would open a
 * second, non-reentrant session.
 */
@Injectable()
export class SignUpService implements SignUpUseCase {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  public async invoke(command: SignUpCommand): Promise<SignUpResult> {
    const email = Email.of(command.email);
    if (await this.userQueryPort.findByEmail(email.raw)) {
      throw new ConflictException("이미 가입된 이메일이에요.");
    }

    const nickname = Nickname.of(command.nickname);
    if (await this.userQueryPort.findByNickname(nickname.raw)) {
      throw new ConflictException("이미 사용 중인 닉네임이에요.");
    }

    const passwordHash = await this.passwordHasher.hash(command.password);

    const user = await this.userPersistencePort.register(
      RegisterUser.of({
        nickname: nickname.raw,
        email: email.raw,
        passwordHash,
        realName: command.realName,
        phone: command.phone,
      }),
    );

    const tokens = await this.refreshTokenService.issue(
      user.getId.toString(),
      user.getNickname.raw,
    );

    return {
      userId: user.getId.toString(),
      nickname: user.getNickname.raw,
      tokens,
    };
  }
}
