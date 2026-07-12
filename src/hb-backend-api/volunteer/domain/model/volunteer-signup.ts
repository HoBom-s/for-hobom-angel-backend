import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";

/**
 * A volunteer's signup for one event. Kept as its own aggregate (the roster) so
 * signing up and withdrawing are auditable records; the event aggregate owns the
 * capacity count that these transitions drive.
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
      VolunteerSignupStatus.ACTIVE,
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

  public withdraw(): void {
    if (this.status !== VolunteerSignupStatus.ACTIVE) {
      throw new Error("이미 철회된 지원이에요.");
    }
    this.status = VolunteerSignupStatus.WITHDRAWN;
  }

  public isActive(): boolean {
    return this.status === VolunteerSignupStatus.ACTIVE;
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
