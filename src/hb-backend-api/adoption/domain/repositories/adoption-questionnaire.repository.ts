import { Types } from "mongoose";
import { AdoptionQuestionnaireEntity } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire.entity";

export type QuestionnaireMutablePatch = Partial<
  Pick<AdoptionQuestionnaireEntity, "questions">
>;

export interface AdoptionQuestionnaireRepository {
  insert(doc: Partial<AdoptionQuestionnaireEntity>): Promise<void>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: QuestionnaireMutablePatch,
  ): Promise<void>;
  findByShelterId(
    shelterId: Types.ObjectId,
  ): Promise<AdoptionQuestionnaireEntity | null>;
}
