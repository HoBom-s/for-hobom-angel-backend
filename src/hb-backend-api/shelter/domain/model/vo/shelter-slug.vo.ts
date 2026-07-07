/**
 * URL slug for the shelter microsite (`/s/:slug`). Lowercase letters, digits and
 * single hyphens; 3–40 chars. Uniqueness is enforced at the persistence layer.
 */
export class ShelterSlug {
  private static readonly PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  public static of(value: string): ShelterSlug {
    const normalized = (value ?? "").trim().toLowerCase();
    if (
      normalized.length < 3 ||
      normalized.length > 40 ||
      !ShelterSlug.PATTERN.test(normalized)
    ) {
      throw new Error("슬러그는 3~40자의 소문자/숫자/하이픈만 가능해요.");
    }
    return new ShelterSlug(normalized);
  }

  public equals(other: ShelterSlug): boolean {
    return this.value === other.value;
  }

  public get raw(): string {
    return this.value;
  }
}
