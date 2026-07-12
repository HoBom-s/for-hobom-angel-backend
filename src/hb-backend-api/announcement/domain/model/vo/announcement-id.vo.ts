import { Types } from "mongoose";

/** Identity of an announcement. Wraps a Mongo ObjectId; validated at construction. */
export class AnnouncementId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): AnnouncementId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Announcement ID 형식이에요. ${id}`);
    }
    return new AnnouncementId(new Types.ObjectId(id));
  }

  public static generate(): AnnouncementId {
    return new AnnouncementId(new Types.ObjectId());
  }

  public equals(other: AnnouncementId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
