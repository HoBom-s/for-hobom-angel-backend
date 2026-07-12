import { Types } from "mongoose";

/** Identity of a report. */
export class ReportId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): ReportId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Report ID 형식이에요. ${id}`);
    }
    return new ReportId(new Types.ObjectId(id));
  }

  public static generate(): ReportId {
    return new ReportId(new Types.ObjectId());
  }

  public equals(other: ReportId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
