import { Types } from "mongoose";
import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * Base for ObjectId-backed identity value objects. It owns the shared identity
 * mechanics (equality, hex serialization, the raw handle for mappers) and the
 * format validation, so each concrete id is a two-factory one-liner:
 *
 * ```ts
 * export class InquiryId extends ObjectIdValueObject {
 *   static fromString(id: string) { return new InquiryId(this.toObjectId(id, "Inquiry")); }
 *   static generate() { return new InquiryId(new Types.ObjectId()); }
 * }
 * ```
 *
 * The constructor stays public so mappers/tests can wrap an existing ObjectId;
 * prefer `fromString`/`generate` in application code.
 */
export abstract class ObjectIdValueObject {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  /**
   * Validates an id string and returns the ObjectId, throwing
   * {@link InvalidInputError} (→ 400) on a malformed id. `label` names the id in
   * the message, e.g. "Inquiry" → "올바르지 않은 Inquiry ID 형식이에요.".
   */
  protected static toObjectId(id: string, label: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new InvalidInputError(
        `올바르지 않은 ${label} ID 형식이에요. ${id}`,
      );
    }
    return new Types.ObjectId(id);
  }

  public equals(other: ObjectIdValueObject): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
