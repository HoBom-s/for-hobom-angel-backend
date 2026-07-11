/**
 * An animal's health facts (중성화·예방접종·마이크로칩·특이사항). Immutable — an
 * update replaces the whole profile, so a partial edit can never leave it
 * half-consistent.
 */
export class HealthProfile {
  constructor(
    private readonly neutered: boolean,
    private readonly vaccinated: boolean,
    private readonly microchipId: string | null,
    private readonly notes: string | null,
  ) {
    Object.freeze(this);
  }

  public static of(params: {
    neutered: boolean;
    vaccinated: boolean;
    microchipId?: string | null;
    notes?: string | null;
  }): HealthProfile {
    return new HealthProfile(
      params.neutered,
      params.vaccinated,
      params.microchipId?.trim() || null,
      params.notes?.trim() || null,
    );
  }

  public get isNeutered(): boolean {
    return this.neutered;
  }
  public get isVaccinated(): boolean {
    return this.vaccinated;
  }
  public get getMicrochipId(): string | null {
    return this.microchipId;
  }
  public get getNotes(): string | null {
    return this.notes;
  }
}
