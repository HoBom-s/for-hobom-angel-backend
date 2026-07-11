import { QuestionType } from "src/hb-backend-api/adoption/domain/enums/question-type.enum";
import { AdoptionQuestionnaire } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire";
import { Answer } from "src/hb-backend-api/adoption/domain/model/answer";
import { Question } from "src/hb-backend-api/adoption/domain/model/question";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

const q = (over: Partial<Parameters<typeof Question.of>[0]> = {}) =>
  Question.of({
    id: "q1",
    prompt: "반려 경험이 있나요?",
    type: QuestionType.BOOLEAN,
    required: true,
    ...over,
  });

const questionnaire = (questions: Question[]) =>
  AdoptionQuestionnaire.define({ shelterId: ShelterId.generate(), questions });

const answer = (questionId: string, values: string[]) =>
  Answer.of({ questionId, values });

describe("AdoptionQuestionnaire / Question", () => {
  it("rejects a choice question with no options", () => {
    expect(() => q({ type: QuestionType.SINGLE_CHOICE, options: [] })).toThrow(
      "선택지",
    );
  });

  it("rejects duplicate question ids", () => {
    expect(() => questionnaire([q({ id: "dup" }), q({ id: "dup" })])).toThrow(
      "중복",
    );
  });

  describe("validateAnswers", () => {
    it("requires an answer to a required question", () => {
      const form = questionnaire([q({ id: "q1", required: true })]);
      expect(() => form.validateAnswers([])).toThrow("필수");
    });

    it("allows a missing answer to an optional question", () => {
      const form = questionnaire([q({ id: "q1", required: false })]);
      expect(() => form.validateAnswers([])).not.toThrow();
    });

    it("enforces boolean shape", () => {
      const form = questionnaire([q({ id: "q1", type: QuestionType.BOOLEAN })]);
      expect(() =>
        form.validateAnswers([answer("q1", ["true"])]),
      ).not.toThrow();
      expect(() => form.validateAnswers([answer("q1", ["yes"])])).toThrow(
        "예/아니오",
      );
    });

    it("enforces single-choice within options", () => {
      const form = questionnaire([
        q({
          id: "q1",
          type: QuestionType.SINGLE_CHOICE,
          options: ["apartment", "house"],
        }),
      ]);
      expect(() =>
        form.validateAnswers([answer("q1", ["house"])]),
      ).not.toThrow();
      expect(() => form.validateAnswers([answer("q1", ["tent"])])).toThrow(
        "선택지",
      );
    });

    it("enforces multi-choice membership", () => {
      const form = questionnaire([
        q({
          id: "q1",
          type: QuestionType.MULTI_CHOICE,
          options: ["dog", "cat", "none"],
          required: false,
        }),
      ]);
      expect(() =>
        form.validateAnswers([answer("q1", ["dog", "cat"])]),
      ).not.toThrow();
      expect(() =>
        form.validateAnswers([answer("q1", ["dog", "fish"])]),
      ).toThrow("선택지에 없는");
    });
  });
});
