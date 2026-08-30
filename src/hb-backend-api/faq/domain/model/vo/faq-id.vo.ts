import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a FAQ entry. Wraps a Mongo ObjectId; validated at construction. */
export class FaqId extends ObjectIdValueObject {
  public static fromString(id: string): FaqId {
    return new FaqId(this.toObjectId(id, "FAQ"));
  }

  public static generate(): FaqId {
    return new FaqId(new Types.ObjectId());
  }
}
