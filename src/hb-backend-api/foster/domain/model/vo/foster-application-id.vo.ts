import { Types } from "mongoose";

/** Identity of a foster application. */
export class FosterApplicationId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): FosterApplicationId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Foster Application ID 형식이에요. ${id}`);
    }
    return new FosterApplicationId(new Types.ObjectId(id));
  }

  public static generate(): FosterApplicationId {
    return new FosterApplicationId(new Types.ObjectId());
  }

  public equals(other: FosterApplicationId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
