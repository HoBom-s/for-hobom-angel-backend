import { Types } from "mongoose";

/** Identity of an approval request. */
export class ApprovalId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): ApprovalId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Approval ID 형식이에요. ${id}`);
    }
    return new ApprovalId(new Types.ObjectId(id));
  }

  public static generate(): ApprovalId {
    return new ApprovalId(new Types.ObjectId());
  }

  public equals(other: ApprovalId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
