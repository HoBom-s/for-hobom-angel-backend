import { Types } from "mongoose";
import { FaqEntity } from "src/hb-backend-api/faq/domain/model/faq.entity";

/** Mutable fields a shelter's staff may edit after posting. */
export type FaqMutablePatch = Partial<
  Pick<FaqEntity, "question" | "answer" | "order">
>;

/** Persistence + read contract over the shelter_faqs collection. */
export interface FaqRepository {
  insert(doc: Partial<FaqEntity>): Promise<FaqEntity>;
  /** Version-guarded update (OCC). Throws OptimisticLockException on a miss. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: FaqMutablePatch,
  ): Promise<void>;
  deleteById(id: Types.ObjectId): Promise<void>;
  findById(id: Types.ObjectId): Promise<FaqEntity | null>;
  /** A shelter's FAQ entries in display order, capped at `limit`. */
  findByShelter(shelterId: Types.ObjectId, limit: number): Promise<FaqEntity[]>;
}
