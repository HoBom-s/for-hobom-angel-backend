import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";

/** Read-side port for volunteer signups. */
export interface VolunteerSignupQueryPort {
  findById(id: VolunteerSignupId): Promise<VolunteerSignup | null>;
  /** A volunteer's still-live (PENDING or APPROVED) signup for an event, if any. */
  findLive(
    eventId: VolunteerEventId,
    volunteerId: UserId,
  ): Promise<VolunteerSignup | null>;
  /** An event's roster (newest first) — for the staff applicant list. */
  findByEvent(eventId: VolunteerEventId): Promise<VolunteerSignup[]>;
  /**
   * A volunteer's still-live signups among the given events — hydrates the
   * per-viewer `mySignupId` on event reads (at most one per event).
   */
  findLiveByVolunteer(
    volunteerId: UserId,
    eventIds: VolunteerEventId[],
  ): Promise<VolunteerSignup[]>;
}
