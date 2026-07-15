import { Types } from "mongoose";

/** Identity of a review. Wraps a Mongo ObjectId; validates format at construction. */
export class ReviewId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): ReviewId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Review ID 형식이에요. ${id}`);
    }
    return new ReviewId(new Types.ObjectId(id));
  }

  public static generate(): ReviewId {
    return new ReviewId(new Types.ObjectId());
  }

  public equals(other: ReviewId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
