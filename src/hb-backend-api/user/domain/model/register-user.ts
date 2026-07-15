import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { PersonName } from "src/hb-backend-api/user/domain/model/vo/person-name.vo";
import { PhoneNumber } from "src/hb-backend-api/user/domain/model/vo/phone-number.vo";

/**
 * Registration write-model. Carries the self-declared PII (real name, phone)
 * needed to create an account exactly once; the persistence adapter encrypts it
 * before storage. `passwordHash` is already a bcrypt hash — the plaintext never
 * reaches this model. All identity fields are validated through their VOs at
 * construction, so an invalid registration cannot be built.
 */
export class RegisterUser {
  private constructor(
    private readonly nickname: Nickname,
    private readonly email: Email,
    private readonly passwordHash: string,
    private readonly realName: PersonName,
    private readonly phone: PhoneNumber,
    private readonly verifiedChannel: VerifiedChannel,
    private readonly roles: UserRole[],
  ) {}

  public static of(params: {
    nickname: string;
    email: string;
    passwordHash: string;
    realName: string;
    phone: string;
    verifiedChannel?: VerifiedChannel;
    roles?: UserRole[];
  }): RegisterUser {
    return new RegisterUser(
      Nickname.of(params.nickname),
      Email.of(params.email),
      params.passwordHash,
      PersonName.of(params.realName),
      PhoneNumber.of(params.phone),
      params.verifiedChannel ?? VerifiedChannel.EMAIL,
      params.roles ?? [UserRole.USER],
    );
  }

  public get getNickname(): Nickname {
    return this.nickname;
  }
  public get getEmail(): Email {
    return this.email;
  }
  public get getPasswordHash(): string {
    return this.passwordHash;
  }
  public get getRealName(): PersonName {
    return this.realName;
  }
  public get getPhone(): PhoneNumber {
    return this.phone;
  }
  public get getVerifiedChannel(): VerifiedChannel {
    return this.verifiedChannel;
  }
  public get getRoles(): UserRole[] {
    return [...this.roles];
  }
}
