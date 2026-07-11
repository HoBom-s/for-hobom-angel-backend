import { Types } from "mongoose";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";

export type ApplicationMutablePatch = Partial<
  Pick<AdoptionApplicationEntity, "status" | "decidedReason">
>;

export interface AdoptionApplicationRepository {
  insert(doc: Partial<AdoptionApplicationEntity>): Promise<void>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ApplicationMutablePatch,
  ): Promise<void>;
  findById(id: Types.ObjectId): Promise<AdoptionApplicationEntity | null>;
}
