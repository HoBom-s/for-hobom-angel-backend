/**
 * The shelter's public "About" content, edited in the management console (§07)
 * and shown on the consumer microsite (§04). All fields are optional — a freshly
 * registered shelter has an empty profile until it fills one in.
 *
 * `intro`/`visitGuide`/`supportGuide` are author-written Markdown; the client
 * renders + sanitizes them (storing HTML would force server-side XSS scrubbing).
 * `operatingSince` is the date the shelter started operating — the client
 * derives "N년 운영" from it. Immutable.
 */
export class ShelterProfile {
  private constructor(
    private readonly intro: string | null,
    private readonly operatingSince: Date | null,
    private readonly representativeName: string | null,
    private readonly visitGuide: string | null,
    private readonly supportGuide: string | null,
  ) {
    Object.freeze(this);
  }

  public static of(params: {
    intro?: string | null;
    operatingSince?: Date | null;
    representativeName?: string | null;
    visitGuide?: string | null;
    supportGuide?: string | null;
  }): ShelterProfile {
    return new ShelterProfile(
      params.intro?.trim() || null,
      params.operatingSince ?? null,
      params.representativeName?.trim() || null,
      params.visitGuide?.trim() || null,
      params.supportGuide?.trim() || null,
    );
  }

  public static empty(): ShelterProfile {
    return new ShelterProfile(null, null, null, null, null);
  }

  public get getIntro(): string | null {
    return this.intro;
  }
  public get getOperatingSince(): Date | null {
    return this.operatingSince;
  }
  public get getRepresentativeName(): string | null {
    return this.representativeName;
  }
  public get getVisitGuide(): string | null {
    return this.visitGuide;
  }
  public get getSupportGuide(): string | null {
    return this.supportGuide;
  }
}
