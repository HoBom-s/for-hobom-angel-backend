import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * Public display name — the ONLY identity field shown in the system (real name
 * and contact are private). 2–20 chars: letters, digits, Korean, `_`, `-`.
 */
export class Nickname {
  private static readonly PATTERN = /^[A-Za-z0-9가-힣_-]{2,20}$/;

  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  public static of(value: string): Nickname {
    const trimmed = value?.trim() ?? "";
    if (!Nickname.PATTERN.test(trimmed)) {
      throw new InvalidInputError(
        "닉네임은 2~20자의 한글/영문/숫자/_/- 만 사용할 수 있어요.",
      );
    }
    return new Nickname(trimmed);
  }

  public equals(other: Nickname): boolean {
    return this.value === other.value;
  }

  public get raw(): string {
    return this.value;
  }
}
