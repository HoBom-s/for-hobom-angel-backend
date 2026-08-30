import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a report. */
export class ReportId extends ObjectIdValueObject {
  public static fromString(id: string): ReportId {
    return new ReportId(this.toObjectId(id, "Report"));
  }

  public static generate(): ReportId {
    return new ReportId(new Types.ObjectId());
  }
}
