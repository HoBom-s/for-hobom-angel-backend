import { Types } from "mongoose";

/** Identity of a favorite. */
export class FavoriteId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): FavoriteId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Favorite ID 형식이에요. ${id}`);
    }
    return new FavoriteId(new Types.ObjectId(id));
  }

  public static generate(): FavoriteId {
    return new FavoriteId(new Types.ObjectId());
  }

  public equals(other: FavoriteId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
