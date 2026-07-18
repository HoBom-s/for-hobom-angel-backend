import { Types } from "mongoose";

/** Identity of a post comment. Wraps a Mongo ObjectId; validated at construction. */
export class VolunteerPostCommentId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): VolunteerPostCommentId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Comment ID 형식이에요. ${id}`);
    }
    return new VolunteerPostCommentId(new Types.ObjectId(id));
  }

  public static generate(): VolunteerPostCommentId {
    return new VolunteerPostCommentId(new Types.ObjectId());
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
