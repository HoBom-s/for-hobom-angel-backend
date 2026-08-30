import { InvalidInputError } from "src/shared/exception/domain-exception";

/** Email address. Normalized to lowercase; format-validated at construction. */
export class Email {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  public static of(value: string): Email {
    const normalized = value?.trim().toLowerCase() ?? "";
    if (!Email.PATTERN.test(normalized)) {
      throw new InvalidInputError(`올바르지 않은 이메일 형식이에요. ${value}`);
    }
    return new Email(normalized);
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  public get raw(): string {
    return this.value;
  }
}
