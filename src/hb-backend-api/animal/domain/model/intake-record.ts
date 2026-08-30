import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * How and when the animal entered the shelter (입소일·구조 경위·공고번호). The
 * `noticeNumber` links to the public 유기동물 공고 (동물보호관리시스템); it's optional
 * because not every intake is a government-notice rescue. Immutable.
 */
export class IntakeRecord {
  constructor(
    private readonly intakeDate: Date,
    private readonly rescueStory: string | null,
    private readonly noticeNumber: string | null,
  ) {
    Object.freeze(this);
  }

  public static of(params: {
    intakeDate: Date;
    rescueStory?: string | null;
    noticeNumber?: string | null;
  }): IntakeRecord {
    if (
      !(params.intakeDate instanceof Date) ||
      isNaN(params.intakeDate.getTime())
    ) {
      throw new InvalidInputError("입소일이 올바르지 않아요.");
    }
    return new IntakeRecord(
      params.intakeDate,
      params.rescueStory?.trim() || null,
      params.noticeNumber?.trim() || null,
    );
  }

  public get getIntakeDate(): Date {
    return this.intakeDate;
  }
  public get getRescueStory(): string | null {
    return this.rescueStory;
  }
  public get getNoticeNumber(): string | null {
    return this.noticeNumber;
  }
}
