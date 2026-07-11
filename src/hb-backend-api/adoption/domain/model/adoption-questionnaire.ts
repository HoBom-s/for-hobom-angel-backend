import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { Answer } from "src/hb-backend-api/adoption/domain/model/answer";
import { Question } from "src/hb-backend-api/adoption/domain/model/question";
import { QuestionnaireId } from "src/hb-backend-api/adoption/domain/model/vo/questionnaire-id.vo";

/**
 * A shelter's pre-application survey — an ordered list of questions its admin
 * defines. One per shelter; editing the questions bumps `version`, and an
 * application snapshots the version it answered so later edits never reinterpret
 * a past submission (see ADR-0009). The aggregate validates an answer set
 * against its questions, keeping that rule out of the services.
 */
export class AdoptionQuestionnaire {
  private constructor(
    private readonly id: QuestionnaireId,
    private readonly shelterId: ShelterId,
    private questions: Question[],
    private readonly version: number,
  ) {}

  public static define(params: {
    shelterId: ShelterId;
    questions: Question[];
  }): AdoptionQuestionnaire {
    AdoptionQuestionnaire.assertUniqueIds(params.questions);
    return new AdoptionQuestionnaire(
      QuestionnaireId.generate(),
      params.shelterId,
      params.questions,
      1,
    );
  }

  public static reconstitute(params: {
    id: QuestionnaireId;
    shelterId: ShelterId;
    questions: Question[];
    version: number;
  }): AdoptionQuestionnaire {
    return new AdoptionQuestionnaire(
      params.id,
      params.shelterId,
      params.questions,
      params.version,
    );
  }

  /**
   * Replace the whole question set (a form edit). `version` is the optimistic-
   * lock counter the persistence layer bumps on save — which doubles as the
   * "questionnaire version" an application snapshots — so it isn't touched here.
   */
  public replaceQuestions(questions: Question[]): void {
    AdoptionQuestionnaire.assertUniqueIds(questions);
    this.questions = questions;
  }

  /** Validates an applicant's answers against every question; throws if invalid. */
  public validateAnswers(answers: Answer[]): void {
    for (const question of this.questions) {
      const answer = answers.find((a) => a.isFor(question.getId));
      question.validateAnswer(answer?.getValues ?? []);
    }
  }

  private static assertUniqueIds(questions: Question[]): void {
    const ids = new Set<string>();
    for (const q of questions) {
      if (ids.has(q.getId)) {
        throw new Error(`질문 id가 중복돼요: ${q.getId}`);
      }
      ids.add(q.getId);
    }
  }

  public get getId(): QuestionnaireId {
    return this.id;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getQuestions(): Question[] {
    return [...this.questions];
  }
  public get getVersion(): number {
    return this.version;
  }
}
