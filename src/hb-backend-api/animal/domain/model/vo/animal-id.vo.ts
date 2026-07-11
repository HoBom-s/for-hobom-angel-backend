import { Types } from "mongoose";

/** Identity of an animal. Wraps a Mongo ObjectId; validates format. */
export class AnimalId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): AnimalId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Animal ID 형식이에요. ${id}`);
    }
    return new AnimalId(new Types.ObjectId(id));
  }

  public static generate(): AnimalId {
    return new AnimalId(new Types.ObjectId());
  }

  public equals(other: AnimalId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
