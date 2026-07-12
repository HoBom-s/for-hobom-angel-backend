import { Types } from "mongoose";

/** Identity of a message. */
export class MessageId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): MessageId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Message ID 형식이에요. ${id}`);
    }
    return new MessageId(new Types.ObjectId(id));
  }

  public static generate(): MessageId {
    return new MessageId(new Types.ObjectId());
  }

  public equals(other: MessageId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
