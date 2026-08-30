import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";
import { BusinessRuleViolationError } from "src/shared/exception/domain-exception";

/**
 * A volunteer's signup for one event. Kept as its own aggregate (the roster) so
 * every transition is an auditable record; the event aggregate owns the capacity
 * count that these transitions drive. A signup is reviewed by the shelter's
 * staff: PENDING → APPROVED (keeps its slot) or REJECTED (frees it). The
 * volunteer may WITHDRAW while still live (PENDING or APPROVED).
 */
export class VolunteerSignup {
  private constructor(
    private readonly id: VolunteerSignupId,
    private readonly eventId: VolunteerEventId,
    private readonly volunteerId: UserId,
    private status: VolunteerSignupStatus,
    private readonly version: number,
  ) {}

  public static submit(params: {
    eventId: VolunteerEventId;
    volunteerId: UserId;
  }): VolunteerSignup {
    return new VolunteerSignup(
      VolunteerSignupId.generate(),
      params.eventId,
      params.volunteerId,
      VolunteerSignupStatus.PENDING,
      0,
    );
  }

  public static reconstitute(params: {
    id: VolunteerSignupId;
    eventId: VolunteerEventId;
    volunteerId: UserId;
    status: VolunteerSignupStatus;
    version: number;
  }): VolunteerSignup {
    return new VolunteerSignup(
      params.id,
      params.eventId,
      params.volunteerId,
      params.status,
      params.version,
    );
  }

  /** Staff approves a pending applicant. */
  public approve(): void {
    this.assertPending("승인");
    this.status = VolunteerSignupStatus.APPROVED;
  }

  /** Staff rejects a pending applicant (the caller frees the event slot). */
  public reject(): void {
    this.assertPending("거절");
    this.status = VolunteerSignupStatus.REJECTED;
  }

  public withdraw(): void {
    if (!this.isLive()) {
      throw new BusinessRuleViolationError("이미 처리된 지원이에요.");
    }
    this.status = VolunteerSignupStatus.WITHDRAWN;
  }

  /** PENDING or APPROVED — the states that still occupy a capacity slot. */
  public isLive(): boolean {
    return (
      this.status === VolunteerSignupStatus.PENDING ||
      this.status === VolunteerSignupStatus.APPROVED
    );
  }

  private assertPending(action: string): void {
    if (this.status !== VolunteerSignupStatus.PENDING) {
      throw new BusinessRuleViolationError(
        `현재 상태(${this.status})에서는 ${action}할 수 없어요.`,
      );
    }
  }

  public isOwnedBy(volunteerId: UserId): boolean {
    return this.volunteerId.equals(volunteerId);
  }

  public get getId(): VolunteerSignupId {
    return this.id;
  }
  public get getEventId(): VolunteerEventId {
    return this.eventId;
  }
  public get getVolunteerId(): UserId {
    return this.volunteerId;
  }
  public get getStatus(): VolunteerSignupStatus {
    return this.status;
  }
  public get getVersion(): number {
    return this.version;
  }
}
