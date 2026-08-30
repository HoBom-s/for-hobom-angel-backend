import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of an animal. Wraps a Mongo ObjectId; validates format. */
export class AnimalId extends ObjectIdValueObject {
  public static fromString(id: string): AnimalId {
    return new AnimalId(this.toObjectId(id, "Animal"));
  }

  public static generate(): AnimalId {
    return new AnimalId(new Types.ObjectId());
  }
}
