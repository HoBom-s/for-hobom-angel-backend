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
  /**
   * A shelter's applications, newest first, keyset-paginated on `_id`. `status`
   * narrows to one status when given. Fetches `limit + 1` to detect a next page.
   */
  findPageByShelter(
    shelterId: Types.ObjectId,
    status: FosterApplicationStatus | null,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<FosterApplicationEntity[]>;
  /** An applicant's own applications, newest first, keyset-paginated on `_id`. */
  findPageByApplicant(
    applicantId: Types.ObjectId,
    status: FosterApplicationStatus | null,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<FosterApplicationEntity[]>;
  countByApplicantAndStatus(
    applicantId: Types.ObjectId,
    status: FosterApplicationStatus,
  ): Promise<number>;
  countByShelterAndStatus(
    shelterId: Types.ObjectId,
    status: FosterApplicationStatus,
  ): Promise<number>;
  countByStatus(status: FosterApplicationStatus): Promise<number>;
}
