import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a favorite. */
export class FavoriteId extends ObjectIdValueObject {
  public static fromString(id: string): FavoriteId {
    return new FavoriteId(this.toObjectId(id, "Favorite"));
  }

  public static generate(): FavoriteId {
    return new FavoriteId(new Types.ObjectId());
  }
}
