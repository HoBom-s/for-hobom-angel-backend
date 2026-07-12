import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { IdentityVerificationPort } from "src/hb-backend-api/identity/domain/ports/out/identity-verification.port";
import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";
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
 * Registers a new member and opens a session:
 *  1. exchange the 본인확인 receipt for the attested identity (CI/real name/phone),
 *  2. reject if the CI already has an account or the nickname is taken,
 *  3. create the user (adapter encrypts PII), then issue a token pair.
 * The CI check is the real "one person, one account" guard; nickname is a UX
 * pre-check backed by the unique index.
 *
 * Deliberately NOT @Transactional: the user insert is a single atomic write and
 * {@link RefreshTokenService.issue} runs its own transaction — wrapping here
 * would open a second, non-reentrant session. In the rare case token issuance
 * fails after the insert, the member simply logs in.
 */
@Injectable()
export class SignUpService implements SignUpUseCase {
  constructor(
    @Inject(DIToken.IdentityModule.IdentityVerificationPort)
    private readonly identityVerificationPort: IdentityVerificationPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  public async invoke(command: SignUpCommand): Promise<SignUpResult> {
    const identity = await this.identityVerificationPort.verify(
      command.verificationToken,
    );

    if (await this.userQueryPort.findByCi(identity.getCi)) {
      throw new ConflictException("이미 가입된 회원이에요.");
    }

    const nickname = Nickname.of(command.nickname);
    if (await this.userQueryPort.findByNickname(nickname.raw)) {
      throw new ConflictException("이미 사용 중인 닉네임이에요.");
    }

    const user = await this.userPersistencePort.register(
      RegisterUser.of({
        nickname: nickname.raw,
        realName: identity.getRealName,
        ci: identity.getCi,
        phone: identity.getPhone,
        email: command.email,
        verifiedChannel: identity.getVerifiedChannel,
        di: identity.getDi,
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
