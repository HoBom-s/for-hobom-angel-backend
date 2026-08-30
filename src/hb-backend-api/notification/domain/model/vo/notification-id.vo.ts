import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of an in-app notification. */
export class NotificationId extends ObjectIdValueObject {
  public static fromString(id: string): NotificationId {
    return new NotificationId(this.toObjectId(id, "Notification"));
  }

  public static generate(): NotificationId {
    return new NotificationId(new Types.ObjectId());
  }
}
