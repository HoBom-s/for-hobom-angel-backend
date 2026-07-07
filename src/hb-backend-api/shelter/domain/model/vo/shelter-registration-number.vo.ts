/**
 * 보호센터등록번호 — the animal-shelter registration number for government-
 * designated centers. Optional (only designated centers have one); when present
 * it is cross-checked against the national shelter dataset via
 * {@link PublicShelterDataPort}.
 */
export class ShelterRegistrationNumber {
  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  public static of(value: string): ShelterRegistrationNumber {
    const trimmed = (value ?? "").trim();
    if (trimmed.length === 0) {
      throw new Error("보호센터등록번호가 비어 있어요.");
    }
    return new ShelterRegistrationNumber(trimmed);
  }

  public equals(other: ShelterRegistrationNumber): boolean {
    return this.value === other.value;
  }

  public get raw(): string {
    return this.value;
  }
}
