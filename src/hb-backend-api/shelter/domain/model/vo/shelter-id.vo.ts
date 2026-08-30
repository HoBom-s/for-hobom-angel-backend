import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/**
 * Identity of a shelter (tenant). Seeded here ahead of the full shelter module
 * because shelter-scoped role grants need it now.
 */
export class ShelterId extends ObjectIdValueObject {
  public static fromString(id: string): ShelterId {
    return new ShelterId(this.toObjectId(id, "Shelter"));
  }

  public static generate(): ShelterId {
    return new ShelterId(new Types.ObjectId());
  }
}
