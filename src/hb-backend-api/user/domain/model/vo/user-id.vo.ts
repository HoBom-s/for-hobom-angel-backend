import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a user. Wraps a Mongo ObjectId; validates format at construction. */
export class UserId extends ObjectIdValueObject {
  public static fromString(id: string): UserId {
    return new UserId(this.toObjectId(id, "User"));
  }

  public static generate(): UserId {
    return new UserId(new Types.ObjectId());
  }
}
