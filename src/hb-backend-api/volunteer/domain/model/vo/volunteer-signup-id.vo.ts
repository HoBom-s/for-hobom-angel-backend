import { Types } from "mongoose";

/** Identity of a volunteer signup. */
export class VolunteerSignupId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): VolunteerSignupId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Volunteer Signup ID 형식이에요. ${id}`);
    }
    return new VolunteerSignupId(new Types.ObjectId(id));
  }

  public static generate(): VolunteerSignupId {
    return new VolunteerSignupId(new Types.ObjectId());
  }

  public equals(other: VolunteerSignupId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
