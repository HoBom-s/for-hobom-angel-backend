import { Types } from "mongoose";
import { ReviewEntity } from "src/hb-backend-api/review/domain/model/review.entity";
import { ShelterReputation } from "src/hb-backend-api/review/domain/model/shelter-reputation";

/** Mutable fields a review's author may edit after creation. */
export type ReviewMutablePatch = Partial<Pick<ReviewEntity, "rating" | "body">>;

/** Persistence + read contract over the reviews collection. */
export interface ReviewRepository {
  insert(doc: Partial<ReviewEntity>): Promise<ReviewEntity>;
  /** Version-guarded update (OCC). Throws OptimisticLockException on a miss. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ReviewMutablePatch,
  ): Promise<void>;
  deleteById(id: Types.ObjectId): Promise<void>;
  findById(id: Types.ObjectId): Promise<ReviewEntity | null>;
  existsByPlacement(
    authorId: Types.ObjectId,
    placementType: string,
    placementRef: Types.ObjectId,
  ): Promise<boolean>;
  /** Keyset page of a shelter's reviews, newest first; fetches `limit + 1`. */
  findByShelter(
    shelterId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<ReviewEntity[]>;
  summarizeByShelter(shelterId: Types.ObjectId): Promise<ShelterReputation>;
}
