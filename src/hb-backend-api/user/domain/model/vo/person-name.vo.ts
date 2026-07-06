/**
 * Legal real name. PII — encrypted at rest, exposed only masked (or unmasked via
 * an audited path). Present only in the registration write-model, never in the
 * loaded authz aggregate.
 */
export class PersonName {
  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  public static of(value: string): PersonName {
    const trimmed = value?.trim() ?? "";
    if (trimmed.length < 1 || trimmed.length > 50) {
      throw new Error("실명은 1~50자여야 해요.");
    }
    return new PersonName(trimmed);
  }

  public get raw(): string {
    return this.value;
  }
}
