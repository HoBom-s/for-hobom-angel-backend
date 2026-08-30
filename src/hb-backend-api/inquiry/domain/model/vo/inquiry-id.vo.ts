import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a shelter inquiry thread. */
export class InquiryId extends ObjectIdValueObject {
  public static fromString(id: string): InquiryId {
    return new InquiryId(this.toObjectId(id, "Inquiry"));
  }

  public static generate(): InquiryId {
    return new InquiryId(new Types.ObjectId());
  }
}
