import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a volunteer signup. */
export class VolunteerSignupId extends ObjectIdValueObject {
  public static fromString(id: string): VolunteerSignupId {
    return new VolunteerSignupId(this.toObjectId(id, "Volunteer Signup"));
  }

  public static generate(): VolunteerSignupId {
    return new VolunteerSignupId(new Types.ObjectId());
  }
}
