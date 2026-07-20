import { Types } from "mongoose";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";

export type ApplicationMutablePatch = Partial<
  Pick<
    AdoptionApplicationEntity,
    "status" | "decidedReason" | "returnedAt" | "returnReason"
  >
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
  /**
   * A shelter's applications, newest first, keyset-paginated on `_id`. `status`
   * narrows to one status (the review queue) when given. Fetches `limit + 1` so
   * the caller can detect a next page.
   */
  findPageByShelter(
    shelterId: Types.ObjectId,
    status: AdoptionApplicationStatus | null,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<AdoptionApplicationEntity[]>;
  /** An applicant's own applications, newest first, keyset-paginated on `_id`. */
  findPageByApplicant(
    applicantId: Types.ObjectId,
    status: AdoptionApplicationStatus | null,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<AdoptionApplicationEntity[]>;
  countByApplicantAndStatus(
    applicantId: Types.ObjectId,
    status: AdoptionApplicationStatus,
  ): Promise<number>;
  countByShelterAndStatus(
    shelterId: Types.ObjectId,
    status: AdoptionApplicationStatus,
  ): Promise<number>;
  countByShelterAndStatusBetween(
    shelterId: Types.ObjectId,
    status: AdoptionApplicationStatus,
    from: Date,
    to: Date,
  ): Promise<number>;
  countByStatus(status: AdoptionApplicationStatus): Promise<number>;
  countByStatusBetween(
    status: AdoptionApplicationStatus,
    from: Date,
    to: Date,
  ): Promise<number>;
}
