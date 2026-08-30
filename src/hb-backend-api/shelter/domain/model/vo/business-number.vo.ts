import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * Korean business / tax-exempt entity number (사업자등록번호 or 비영리 고유번호) —
 * 10 digits, stored normalized. Non-profit 고유번호 shares the 10-digit format, so
 * only length/shape is validated here; authenticity is checked against the tax
 * office via {@link BusinessRegistryPort}, not by a local checksum.
 */
export class BusinessNumber {
  private static readonly PATTERN = /^\d{10}$/;

  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  public static of(value: string): BusinessNumber {
    const digits = (value ?? "").replace(/\D/g, "");
    if (!BusinessNumber.PATTERN.test(digits)) {
      throw new InvalidInputError("사업자/고유번호는 10자리 숫자여야 해요.");
    }
    return new BusinessNumber(digits);
  }

  public equals(other: BusinessNumber): boolean {
    return this.value === other.value;
  }

  public get raw(): string {
    return this.value;
  }
}
