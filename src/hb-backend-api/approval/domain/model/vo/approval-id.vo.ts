import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of an approval request. */
export class ApprovalId extends ObjectIdValueObject {
  public static fromString(id: string): ApprovalId {
    return new ApprovalId(this.toObjectId(id, "Approval"));
  }

  public static generate(): ApprovalId {
    return new ApprovalId(new Types.ObjectId());
  }
}
