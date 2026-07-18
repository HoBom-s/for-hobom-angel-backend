import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";

/**
 * Descriptive characteristics used for display and discovery filters (성별·크기·
 * 나이·몸무게·품종·털색·성격). Age is an *estimate* in months (rescues rarely have an
 * exact birthdate); weight is in kilograms and may be fractional; breed and color
 * are best-guess free text. Immutable.
 */
export class Traits {
  constructor(
    private readonly sex: AnimalSex,
    private readonly size: AnimalSize,
    private readonly ageMonths: number | null,
    private readonly breed: string | null,
    private readonly color: string | null,
    private readonly personality: string | null,
    private readonly weightKg: number | null,
  ) {
    Object.freeze(this);
  }

  public static of(params: {
    sex: AnimalSex;
    size: AnimalSize;
    ageMonths?: number | null;
    breed?: string | null;
    color?: string | null;
    personality?: string | null;
    weightKg?: number | null;
  }): Traits {
    if (params.ageMonths != null && params.ageMonths < 0) {
      throw new Error("나이(개월)는 음수일 수 없어요.");
    }
    if (params.weightKg != null && params.weightKg < 0) {
      throw new Error("몸무게(kg)는 음수일 수 없어요.");
    }
    return new Traits(
      params.sex,
      params.size,
      params.ageMonths ?? null,
      params.breed?.trim() || null,
      params.color?.trim() || null,
      params.personality?.trim() || null,
      params.weightKg ?? null,
    );
  }

  public get getSex(): AnimalSex {
    return this.sex;
  }
  public get getSize(): AnimalSize {
    return this.size;
  }
  public get getAgeMonths(): number | null {
    return this.ageMonths;
  }
  public get getBreed(): string | null {
    return this.breed;
  }
  public get getColor(): string | null {
    return this.color;
  }
  public get getPersonality(): string | null {
    return this.personality;
  }
  public get getWeightKg(): number | null {
    return this.weightKg;
  }
}
