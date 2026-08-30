import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of an announcement. Wraps a Mongo ObjectId; validated at construction. */
export class AnnouncementId extends ObjectIdValueObject {
  public static fromString(id: string): AnnouncementId {
    return new AnnouncementId(this.toObjectId(id, "Announcement"));
  }

  public static generate(): AnnouncementId {
    return new AnnouncementId(new Types.ObjectId());
  }
}
