import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * One applicant answer: the question it addresses and the chosen/entered values.
 * Values are always a string list — a boolean is ["true"], a single choice or
 * free-text is one element, a multi-choice is many. Immutable.
 */
export class Answer {
  constructor(
    private readonly questionId: string,
    private readonly values: string[],
  ) {
    Object.freeze(this);
    Object.freeze(this.values);
  }

  public static of(params: { questionId: string; values: string[] }): Answer {
    if (!params.questionId?.trim()) {
      throw new InvalidInputError("답변에 questionId가 필요해요.");
    }
    return new Answer(
      params.questionId.trim(),
      (params.values ?? []).map((v) => v.trim()).filter((v) => v.length > 0),
    );
  }

  public isFor(questionId: string): boolean {
    return this.questionId === questionId;
  }

  public get getQuestionId(): string {
    return this.questionId;
  }
  public get getValues(): string[] {
    return [...this.values];
  }
}
