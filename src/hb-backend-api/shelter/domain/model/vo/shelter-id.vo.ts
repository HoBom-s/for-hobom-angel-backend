import { Types } from "mongoose";

/**
 * Identity of a shelter (tenant). Seeded here ahead of the full shelter module
 * because shelter-scoped role grants need it now.
 */
export class ShelterId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): ShelterId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Shelter ID 형식이에요. ${id}`);
    }
    return new ShelterId(new Types.ObjectId(id));
  }

  public equals(other: ShelterId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
