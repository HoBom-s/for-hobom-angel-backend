import { ConsentStatus } from "src/hb-backend-api/consent/domain/enums/consent-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { BusinessRuleViolationError } from "src/shared/exception/domain-exception";

/**
 * A user's standing consent to a policy type. Granting (or re-granting to a newer
 * version) sets GRANTED and binds the agreed version; withdrawing flips to
 * WITHDRAWN. History is the audit trail's job, not this aggregate's.
 */
export class Consent {
  private constructor(
    private readonly id: string | null,
    private readonly userId: string,
    private readonly policyType: PolicyType,
    private agreedVersion: number,
    private status: ConsentStatus,
    private grantedAt: Date,
    private withdrawnAt: Date | null,
  ) {}

  public static grant(
    userId: string,
    policyType: PolicyType,
    agreedVersion: number,
    now: Date,
  ): Consent {
    return new Consent(
      null,
      userId,
      policyType,
      agreedVersion,
      ConsentStatus.GRANTED,
      now,
      null,
    );
  }

  public static reconstitute(params: {
    id: string;
    userId: string;
    policyType: PolicyType;
    agreedVersion: number;
    status: ConsentStatus;
    grantedAt: Date;
    withdrawnAt: Date | null;
  }): Consent {
    return new Consent(
      params.id,
      params.userId,
      params.policyType,
      params.agreedVersion,
      params.status,
      params.grantedAt,
      params.withdrawnAt,
    );
  }

  /** Re-affirm consent (e.g. to a newer version). */
  public reGrant(agreedVersion: number, now: Date): void {
    this.agreedVersion = agreedVersion;
    this.status = ConsentStatus.GRANTED;
    this.grantedAt = now;
    this.withdrawnAt = null;
  }

  public withdraw(now: Date): void {
    if (this.status !== ConsentStatus.GRANTED) {
      throw new BusinessRuleViolationError("동의한 내역이 없어요.");
    }
    this.status = ConsentStatus.WITHDRAWN;
    this.withdrawnAt = now;
  }

  public isGranted(): boolean {
    return this.status === ConsentStatus.GRANTED;
  }

  public get getId(): string | null {
    return this.id;
  }
  public get getUserId(): string {
    return this.userId;
  }
  public get getPolicyType(): PolicyType {
    return this.policyType;
  }
  public get getAgreedVersion(): number {
    return this.agreedVersion;
  }
  public get getStatus(): ConsentStatus {
    return this.status;
  }
  public get getGrantedAt(): Date {
    return this.grantedAt;
  }
  public get getWithdrawnAt(): Date | null {
    return this.withdrawnAt;
  }
}
