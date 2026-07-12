import { Types } from "mongoose";

/** Identity of a FAQ entry. Wraps a Mongo ObjectId; validated at construction. */
export class FaqId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): FaqId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 FAQ ID 형식이에요. ${id}`);
    }
    return new FaqId(new Types.ObjectId(id));
  }

  public static generate(): FaqId {
    return new FaqId(new Types.ObjectId());
  }

  public equals(other: FaqId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
