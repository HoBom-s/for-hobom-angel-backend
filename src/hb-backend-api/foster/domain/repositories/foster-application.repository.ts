import { Types } from "mongoose";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";

export type FosterApplicationMutablePatch = Partial<
  Pick<
    FosterApplicationEntity,
    "status" | "decidedReason" | "endedAt" | "endReason"
  >
>;

export interface FosterApplicationRepository {
  insert(doc: Partial<FosterApplicationEntity>): Promise<void>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: FosterApplicationMutablePatch,
  ): Promise<void>;
  findById(id: Types.ObjectId): Promise<FosterApplicationEntity | null>;
  countByApplicantAndStatus(
    applicantId: Types.ObjectId,
    status: FosterApplicationStatus,
  ): Promise<number>;
  countByShelterAndStatus(
    shelterId: Types.ObjectId,
    status: FosterApplicationStatus,
  ): Promise<number>;
}
