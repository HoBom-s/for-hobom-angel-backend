import { Types } from "mongoose";

/** Identity of a volunteer post. Wraps a Mongo ObjectId; validated at construction. */
export class VolunteerPostId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): VolunteerPostId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 VolunteerPost ID 형식이에요. ${id}`);
    }
    return new VolunteerPostId(new Types.ObjectId(id));
  }

  public static generate(): VolunteerPostId {
    return new VolunteerPostId(new Types.ObjectId());
  }

  public equals(other: VolunteerPostId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
