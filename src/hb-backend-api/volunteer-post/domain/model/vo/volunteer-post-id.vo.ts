import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a volunteer post. Wraps a Mongo ObjectId; validated at construction. */
export class VolunteerPostId extends ObjectIdValueObject {
  public static fromString(id: string): VolunteerPostId {
    return new VolunteerPostId(this.toObjectId(id, "VolunteerPost"));
  }

  public static generate(): VolunteerPostId {
    return new VolunteerPostId(new Types.ObjectId());
  }
}
