import { BusinessRuleViolationError } from "src/shared/exception/domain-exception";

/** One completed-participation line, snapshotted onto a certificate. */
export interface CertificateItem {
  eventId: string;
  eventTitle: string;
  shelterId: string;
  shelterName: string;
  startAt: Date;
  endAt: Date;
  minutes: number;
}

/**
 * Issued volunteer-service certificate aggregate. Immutable once issued: it is a
 * snapshot of the member's completed participations + totals, addressed by an
 * unguessable `certificateNo` for third-party verification.
 */
export class VolunteerCertificate {
  private constructor(
    private readonly id: string | null,
    private readonly certificateNo: string,
    private readonly userId: string,
    private readonly volunteerNickname: string,
    private readonly issuedAt: Date,
    private readonly items: CertificateItem[],
    private readonly totalCount: number,
    private readonly totalMinutes: number,
  ) {}

  public static issue(params: {
    certificateNo: string;
    userId: string;
    volunteerNickname: string;
    items: CertificateItem[];
    now: Date;
  }): VolunteerCertificate {
    if (params.items.length === 0) {
      throw new BusinessRuleViolationError(
        "완료된 봉사 참여가 없어 확인서를 발급할 수 없어요.",
      );
    }
    const totalMinutes = params.items.reduce((sum, i) => sum + i.minutes, 0);
    return new VolunteerCertificate(
      null,
      params.certificateNo,
      params.userId,
      params.volunteerNickname,
      params.now,
      params.items,
      params.items.length,
      totalMinutes,
    );
  }

  public static reconstitute(params: {
    id: string;
    certificateNo: string;
    userId: string;
    volunteerNickname: string;
    issuedAt: Date;
    items: CertificateItem[];
    totalCount: number;
    totalMinutes: number;
  }): VolunteerCertificate {
    return new VolunteerCertificate(
      params.id,
      params.certificateNo,
      params.userId,
      params.volunteerNickname,
      params.issuedAt,
      params.items,
      params.totalCount,
      params.totalMinutes,
    );
  }

  public get getId(): string | null {
    return this.id;
  }
  public get getCertificateNo(): string {
    return this.certificateNo;
  }
  public get getUserId(): string {
    return this.userId;
  }
  public get getVolunteerNickname(): string {
    return this.volunteerNickname;
  }
  public get getIssuedAt(): Date {
    return this.issuedAt;
  }
  public get getItems(): CertificateItem[] {
    return [...this.items];
  }
  public get getTotalCount(): number {
    return this.totalCount;
  }
  public get getTotalMinutes(): number {
    return this.totalMinutes;
  }
}
