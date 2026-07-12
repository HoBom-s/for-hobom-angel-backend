import { Types } from "mongoose";

/** Identity of a volunteer event. */
export class VolunteerEventId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): VolunteerEventId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Volunteer Event ID 형식이에요. ${id}`);
    }
    return new VolunteerEventId(new Types.ObjectId(id));
  }

  public static generate(): VolunteerEventId {
    return new VolunteerEventId(new Types.ObjectId());
  }

  public equals(other: VolunteerEventId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
