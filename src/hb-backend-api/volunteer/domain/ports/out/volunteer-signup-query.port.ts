import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";

/** Read-side port for volunteer signups. */
export interface VolunteerSignupQueryPort {
  findById(id: VolunteerSignupId): Promise<VolunteerSignup | null>;
  findActive(
    eventId: VolunteerEventId,
    volunteerId: UserId,
  ): Promise<VolunteerSignup | null>;
}
