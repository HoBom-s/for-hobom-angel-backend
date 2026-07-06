import { Types } from "mongoose";

/** Identity of a user. Wraps a Mongo ObjectId; validates format at construction. */
export class UserId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): UserId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 User ID 형식이에요. ${id}`);
    }
    return new UserId(new Types.ObjectId(id));
  }

  public static generate(): UserId {
    return new UserId(new Types.ObjectId());
  }

  public equals(other: UserId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
