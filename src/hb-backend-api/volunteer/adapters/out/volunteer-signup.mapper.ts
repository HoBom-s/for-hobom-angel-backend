import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";
import { VolunteerSignupMutablePatch } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-signup.repository";

export function toDomain(doc: VolunteerSignupEntity): VolunteerSignup {
  return VolunteerSignup.reconstitute({
    id: VolunteerSignupId.fromString(String(doc._id)),
    eventId: VolunteerEventId.fromString(String(doc.eventId)),
    volunteerId: UserId.fromString(String(doc.volunteerId)),
    status: doc.status,
    version: doc.version ?? 0,
  });
}

export function toInsertDoc(
  signup: VolunteerSignup,
): Partial<VolunteerSignupEntity> {
  return {
    _id: signup.getId.raw,
    eventId: signup.getEventId.raw,
    volunteerId: signup.getVolunteerId.raw,
    status: signup.getStatus,
    version: signup.getVersion,
  };
}

export function toMutablePatch(
  signup: VolunteerSignup,
): VolunteerSignupMutablePatch {
  return { status: signup.getStatus };
}
