import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import { Answer } from "src/hb-backend-api/questionnaire/domain/model/answer";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";
import { ApplicationMutablePatch } from "src/hb-backend-api/adoption/domain/repositories/adoption-application.repository";

export function toDomain(doc: AdoptionApplicationEntity): AdoptionApplication {
  return AdoptionApplication.reconstitute({
    id: ApplicationId.fromString(String(doc._id)),
    animalId: AnimalId.fromString(String(doc.animalId)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    applicantId: UserId.fromString(String(doc.applicantId)),
    questionnaireVersion: doc.questionnaireVersion ?? 0,
    answers: (doc.answers ?? []).map((a) =>
      Answer.of({ questionId: a.questionId, values: a.values }),
    ),
    status: doc.status,
    decidedReason: doc.decidedReason ?? null,
    returnedAt: doc.returnedAt ?? null,
    returnReason: doc.returnReason ?? null,
    version: doc.version ?? 0,
    createdAt: doc.createdAt ?? null,
  });
}

export function toInsertDoc(
  application: AdoptionApplication,
): Partial<AdoptionApplicationEntity> {
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
    status: application.getStatus,
    decidedReason: application.getDecidedReason ?? undefined,
    version: application.getVersion,
  };
}

export function toMutablePatch(
  application: AdoptionApplication,
): ApplicationMutablePatch {
  return {
    status: application.getStatus,
    decidedReason: application.getDecidedReason ?? undefined,
    returnedAt: application.getReturnedAt ?? undefined,
    returnReason: application.getReturnReason ?? undefined,
  };
}
