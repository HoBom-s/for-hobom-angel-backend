import { Types } from "mongoose";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";
import { QuestionnaireEntity } from "src/hb-backend-api/questionnaire/domain/model/questionnaire.entity";

export type QuestionnaireMutablePatch = Partial<
  Pick<QuestionnaireEntity, "questions">
>;

export interface QuestionnaireRepository {
  insert(doc: Partial<QuestionnaireEntity>): Promise<void>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: QuestionnaireMutablePatch,
  ): Promise<void>;
  findByShelterAndPurpose(
    shelterId: Types.ObjectId,
    purpose: QuestionnairePurpose,
  ): Promise<QuestionnaireEntity | null>;
}
