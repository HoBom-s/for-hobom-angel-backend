import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a review. Wraps a Mongo ObjectId; validates format at construction. */
export class ReviewId extends ObjectIdValueObject {
  public static fromString(id: string): ReviewId {
    return new ReviewId(this.toObjectId(id, "Review"));
  }

  public static generate(): ReviewId {
    return new ReviewId(new Types.ObjectId());
  }
}
