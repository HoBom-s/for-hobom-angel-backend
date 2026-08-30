import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a message. */
export class MessageId extends ObjectIdValueObject {
  public static fromString(id: string): MessageId {
    return new MessageId(this.toObjectId(id, "Message"));
  }

  public static generate(): MessageId {
    return new MessageId(new Types.ObjectId());
  }
}
