import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { Ci } from "src/hb-backend-api/user/domain/model/vo/ci.vo";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { PersonName } from "src/hb-backend-api/user/domain/model/vo/person-name.vo";
import { PhoneNumber } from "src/hb-backend-api/user/domain/model/vo/phone-number.vo";

/**
 * Registration write-model. Carries the PII (real name, phone) needed to create
 * an account exactly once; the persistence adapter encrypts it before storage.
 * All fields are validated through their VOs at construction — an invalid
 * registration cannot be built. Produced after identity verification yields CI.
 */
export class RegisterUser {
  private constructor(
    private readonly nickname: Nickname,
    private readonly realName: PersonName,
    private readonly ci: Ci,
    private readonly phone: PhoneNumber,
    private readonly email: Email,
    private readonly verifiedChannel: VerifiedChannel,
    private readonly di: string | null,
    private readonly roles: UserRole[],
  ) {}

  public static of(params: {
    nickname: string;
    realName: string;
    ci: string;
    phone: string;
    email: string;
    verifiedChannel: VerifiedChannel;
    di?: string | null;
    roles?: UserRole[];
  }): RegisterUser {
    return new RegisterUser(
      Nickname.of(params.nickname),
      PersonName.of(params.realName),
      Ci.of(params.ci),
      PhoneNumber.of(params.phone),
      Email.of(params.email),
      params.verifiedChannel,
      params.di ?? null,
      params.roles ?? [UserRole.USER],
    );
  }

  public get getNickname(): Nickname {
    return this.nickname;
  }
  public get getRealName(): PersonName {
    return this.realName;
  }
  public get getCi(): Ci {
    return this.ci;
  }
  public get getPhone(): PhoneNumber {
    return this.phone;
  }
  public get getEmail(): Email {
    return this.email;
  }
  public get getVerifiedChannel(): VerifiedChannel {
    return this.verifiedChannel;
  }
  public get getDi(): string | null {
    return this.di;
  }
  public get getRoles(): UserRole[] {
    return [...this.roles];
  }
}
