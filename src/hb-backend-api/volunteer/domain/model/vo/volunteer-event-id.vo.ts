import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a volunteer event. */
export class VolunteerEventId extends ObjectIdValueObject {
  public static fromString(id: string): VolunteerEventId {
    return new VolunteerEventId(this.toObjectId(id, "Volunteer Event"));
  }

  public static generate(): VolunteerEventId {
    return new VolunteerEventId(new Types.ObjectId());
  }
}
