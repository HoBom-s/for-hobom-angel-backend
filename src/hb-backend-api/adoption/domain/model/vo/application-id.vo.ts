import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of an adoption application. */
export class ApplicationId extends ObjectIdValueObject {
  public static fromString(id: string): ApplicationId {
    return new ApplicationId(this.toObjectId(id, "Application"));
  }

  public static generate(): ApplicationId {
    return new ApplicationId(new Types.ObjectId());
  }
}
