import { QuestionType } from "src/hb-backend-api/adoption/domain/enums/question-type.enum";

/**
 * One pre-application question a shelter defines. Immutable; it also knows how to
 * validate an answer against itself, so the rule for "is this a valid response"
 * lives with the question, not scattered across services.
 */
export class Question {
  constructor(
    private readonly id: string,
    private readonly prompt: string,
    private readonly type: QuestionType,
    private readonly options: string[],
    private readonly required: boolean,
  ) {
    Object.freeze(this);
    Object.freeze(this.options);
  }

  public static of(params: {
    id: string;
    prompt: string;
    type: QuestionType;
    options?: string[];
    required?: boolean;
  }): Question {
    if (!params.id?.trim()) {
      throw new Error("질문 id가 필요해요.");
    }
    if (!params.prompt?.trim()) {
      throw new Error("질문 내용이 필요해요.");
    }
    const options = (params.options ?? []).map((o) => o.trim()).filter(Boolean);
    const isChoice =
      params.type === QuestionType.SINGLE_CHOICE ||
      params.type === QuestionType.MULTI_CHOICE;
    if (isChoice && options.length === 0) {
      throw new Error("선택형 질문에는 선택지가 필요해요.");
    }
    return new Question(
      params.id.trim(),
      params.prompt.trim(),
      params.type,
      options,
      params.required ?? false,
    );
  }

  /** Validates the applicant's values for this question; throws if invalid. */
  public validateAnswer(values: string[]): void {
    if (values.length === 0) {
      if (this.required) {
        throw new Error(`필수 질문에 답해야 해요: ${this.prompt}`);
      }
      return;
    }
    switch (this.type) {
      case QuestionType.TEXT:
        if (values.length !== 1) {
          throw new Error(`주관식 답변은 하나여야 해요: ${this.prompt}`);
        }
        break;
      case QuestionType.BOOLEAN:
        if (values.length !== 1 || !["true", "false"].includes(values[0])) {
          throw new Error(`예/아니오로 답해야 해요: ${this.prompt}`);
        }
        break;
      case QuestionType.SINGLE_CHOICE:
        if (values.length !== 1 || !this.options.includes(values[0])) {
          throw new Error(`선택지 중 하나를 골라야 해요: ${this.prompt}`);
        }
        break;
      case QuestionType.MULTI_CHOICE:
        if (!values.every((v) => this.options.includes(v))) {
          throw new Error(`선택지에 없는 값이 있어요: ${this.prompt}`);
        }
        break;
    }
  }

  public toPlain(): {
    id: string;
    prompt: string;
    type: QuestionType;
    options: string[];
    required: boolean;
  } {
    return {
      id: this.id,
      prompt: this.prompt,
      type: this.type,
      options: [...this.options],
      required: this.required,
    };
  }

  public get getId(): string {
    return this.id;
  }
  public get getPrompt(): string {
    return this.prompt;
  }
  public get getType(): QuestionType {
    return this.type;
  }
  public get getOptions(): string[] {
    return [...this.options];
  }
  public get isRequired(): boolean {
    return this.required;
  }
}
