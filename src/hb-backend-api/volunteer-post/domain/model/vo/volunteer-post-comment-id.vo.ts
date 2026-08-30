import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a post comment. Wraps a Mongo ObjectId; validated at construction. */
export class VolunteerPostCommentId extends ObjectIdValueObject {
  public static fromString(id: string): VolunteerPostCommentId {
    return new VolunteerPostCommentId(this.toObjectId(id, "Comment"));
  }

  public static generate(): VolunteerPostCommentId {
    return new VolunteerPostCommentId(new Types.ObjectId());
  }
}
