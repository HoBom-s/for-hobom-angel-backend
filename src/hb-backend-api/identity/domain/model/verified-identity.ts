import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";

/**
 * The result of a successful 본인확인 (identity verification): the real-world
 * identity a vendor (CI/DI provider) attests to for a verification receipt.
 * `ci` is the stable cross-service identifier (one natural person → one CI);
 * `di` is the per-service derived identifier. Carries the PII the account needs
 * exactly once at registration — it is never stored on this value.
 */
export class VerifiedIdentity {
  private constructor(
    private readonly ci: string,
    private readonly di: string | null,
    private readonly realName: string,
    private readonly phone: string,
    private readonly verifiedChannel: VerifiedChannel,
  ) {
    Object.freeze(this);
  }

  public static of(params: {
    ci: string;
    di?: string | null;
    realName: string;
    phone: string;
    verifiedChannel: VerifiedChannel;
  }): VerifiedIdentity {
    return new VerifiedIdentity(
      params.ci,
      params.di ?? null,
      params.realName,
      params.phone,
      params.verifiedChannel,
    );
  }

  public get getCi(): string {
    return this.ci;
  }
  public get getDi(): string | null {
    return this.di;
  }
  public get getRealName(): string {
    return this.realName;
  }
  public get getPhone(): string {
    return this.phone;
  }
  public get getVerifiedChannel(): VerifiedChannel {
    return this.verifiedChannel;
  }
}
