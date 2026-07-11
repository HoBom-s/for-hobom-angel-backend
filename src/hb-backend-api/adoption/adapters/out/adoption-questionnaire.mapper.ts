import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { AdoptionQuestionnaire } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire";
import { AdoptionQuestionnaireEntity } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire.entity";
import { Question } from "src/hb-backend-api/adoption/domain/model/question";
import { QuestionnaireId } from "src/hb-backend-api/adoption/domain/model/vo/questionnaire-id.vo";
import { QuestionnaireMutablePatch } from "src/hb-backend-api/adoption/domain/repositories/adoption-questionnaire.repository";

export function toDomain(
  doc: AdoptionQuestionnaireEntity,
): AdoptionQuestionnaire {
  return AdoptionQuestionnaire.reconstitute({
    id: QuestionnaireId.fromString(String(doc._id)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    questions: (doc.questions ?? []).map((q) =>
      Question.of({
        id: q.id,
        prompt: q.prompt,
        type: q.type,
        options: q.options,
        required: q.required,
      }),
    ),
    version: doc.version ?? 1,
  });
}

export function toInsertDoc(
  questionnaire: AdoptionQuestionnaire,
): Partial<AdoptionQuestionnaireEntity> {
  return {
    _id: questionnaire.getId.raw,
    shelterId: questionnaire.getShelterId.raw,
    questions: questionnaire.getQuestions.map((q) => q.toPlain()),
    version: questionnaire.getVersion,
  };
}

export function toMutablePatch(
  questionnaire: AdoptionQuestionnaire,
): QuestionnaireMutablePatch {
  return { questions: questionnaire.getQuestions.map((q) => q.toPlain()) };
}
