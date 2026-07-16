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
