import { Types } from "mongoose";

/** Identity of an in-app notification. */
export class NotificationId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): NotificationId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Notification ID 형식이에요. ${id}`);
    }
    return new NotificationId(new Types.ObjectId(id));
  }

  public static generate(): NotificationId {
    return new NotificationId(new Types.ObjectId());
  }

  public equals(other: NotificationId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
