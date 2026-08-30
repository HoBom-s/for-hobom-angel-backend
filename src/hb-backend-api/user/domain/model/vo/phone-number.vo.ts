import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * Korean mobile number. Stored normalized to digits (`01012345678`); the raw
 * value is PII and encrypted at rest — never exposed unmasked without audit.
 */
export class PhoneNumber {
  private static readonly PATTERN = /^010\d{8}$/;

  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  public static of(value: string): PhoneNumber {
    const digits = (value ?? "").replace(/\D/g, "");
    if (!PhoneNumber.PATTERN.test(digits)) {
      throw new InvalidInputError("올바르지 않은 휴대폰 번호 형식이에요.");
    }
    return new PhoneNumber(digits);
  }

  public equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  public get raw(): string {
    return this.value;
  }
}
