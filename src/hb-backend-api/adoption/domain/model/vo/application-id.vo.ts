import { Types } from "mongoose";

/** Identity of an adoption application. */
export class ApplicationId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): ApplicationId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Application ID 형식이에요. ${id}`);
    }
    return new ApplicationId(new Types.ObjectId(id));
  }

  public static generate(): ApplicationId {
    return new ApplicationId(new Types.ObjectId());
  }

  public equals(other: ApplicationId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
