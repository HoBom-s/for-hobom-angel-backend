import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { Answer } from "src/hb-backend-api/questionnaire/domain/model/answer";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";
import { FosterApplicationMutablePatch } from "src/hb-backend-api/foster/domain/repositories/foster-application.repository";

export function toDomain(doc: FosterApplicationEntity): FosterApplication {
  return FosterApplication.reconstitute({
    id: FosterApplicationId.fromString(String(doc._id)),
    animalId: AnimalId.fromString(String(doc.animalId)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    applicantId: UserId.fromString(String(doc.applicantId)),
    questionnaireVersion: doc.questionnaireVersion ?? 0,
    answers: (doc.answers ?? []).map((a) =>
      Answer.of({ questionId: a.questionId, values: a.values }),
    ),
    plannedEndDate: doc.plannedEndDate ?? null,
    status: doc.status,
    decidedReason: doc.decidedReason ?? null,
    endedAt: doc.endedAt ?? null,
    endReason: doc.endReason ?? null,
    version: doc.version ?? 0,
    createdAt: doc.createdAt ?? null,
  });
}

export function toInsertDoc(
  application: FosterApplication,
): Partial<FosterApplicationEntity> {
  return {
    _id: application.getId.raw,
    animalId: application.getAnimalId.raw,
    shelterId: application.getShelterId.raw,
    applicantId: application.getApplicantId.raw,
    questionnaireVersion: application.getQuestionnaireVersion,
    answers: application.getAnswers.map((a) => ({
      questionId: a.getQuestionId,
      values: a.getValues,
    })),
    plannedEndDate: application.getPlannedEndDate,
    status: application.getStatus,
    decidedReason: application.getDecidedReason ?? undefined,
    endedAt: application.getEndedAt,
    endReason: application.getEndReason,
    version: application.getVersion,
  };
}

export function toMutablePatch(
  application: FosterApplication,
): FosterApplicationMutablePatch {
  return {
    status: application.getStatus,
    decidedReason: application.getDecidedReason ?? undefined,
    endedAt: application.getEndedAt,
    endReason: application.getEndReason,
  };
}
