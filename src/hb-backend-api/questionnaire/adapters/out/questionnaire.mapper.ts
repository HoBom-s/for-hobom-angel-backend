import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { Questionnaire } from "src/hb-backend-api/questionnaire/domain/model/questionnaire";
import { QuestionnaireEntity } from "src/hb-backend-api/questionnaire/domain/model/questionnaire.entity";
import { Question } from "src/hb-backend-api/questionnaire/domain/model/question";
import { QuestionnaireId } from "src/hb-backend-api/questionnaire/domain/model/vo/questionnaire-id.vo";
import { QuestionnaireMutablePatch } from "src/hb-backend-api/questionnaire/domain/repositories/questionnaire.repository";

export function toDomain(doc: QuestionnaireEntity): Questionnaire {
  return Questionnaire.reconstitute({
    id: QuestionnaireId.fromString(String(doc._id)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    purpose: doc.purpose,
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
  questionnaire: Questionnaire,
): Partial<QuestionnaireEntity> {
  return {
    _id: questionnaire.getId.raw,
    shelterId: questionnaire.getShelterId.raw,
    purpose: questionnaire.getPurpose,
    questions: questionnaire.getQuestions.map((q) => q.toPlain()),
    version: questionnaire.getVersion,
  };
}

export function toMutablePatch(
  questionnaire: Questionnaire,
): QuestionnaireMutablePatch {
  return { questions: questionnaire.getQuestions.map((q) => q.toPlain()) };
}
