import { Types } from "mongoose";

/** Identity of a shelter inquiry thread. */
export class InquiryId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): InquiryId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Inquiry ID 형식이에요. ${id}`);
    }
    return new InquiryId(new Types.ObjectId(id));
  }

  public static generate(): InquiryId {
    return new InquiryId(new Types.ObjectId());
  }

  public equals(other: InquiryId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
