/**
 * Connecting Information — the irreversible per-person identity value issued by
 * the identity-verification provider. Used to detect duplicate signups; the RRN
 * itself is never stored. Treated as opaque; only non-emptiness is validated.
 */
export class Ci {
  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  public static of(value: string): Ci {
    const trimmed = value?.trim() ?? "";
    if (trimmed.length === 0) {
      throw new Error("CI 값이 비어 있어요.");
    }
    return new Ci(trimmed);
  }

  public equals(other: Ci): boolean {
    return this.value === other.value;
  }

  public get raw(): string {
    return this.value;
  }
}
