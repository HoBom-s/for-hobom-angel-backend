import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a foster application. */
export class FosterApplicationId extends ObjectIdValueObject {
  public static fromString(id: string): FosterApplicationId {
    return new FosterApplicationId(this.toObjectId(id, "Foster Application"));
  }

  public static generate(): FosterApplicationId {
    return new FosterApplicationId(new Types.ObjectId());
  }
}
