import { Types } from "mongoose";
import { ReportEntity } from "src/hb-backend-api/report/domain/model/report.entity";

/** Mutable fields once the report is resolved. */
export type ReportMutablePatch = Partial<
  Pick<
    ReportEntity,
    "status" | "resolution" | "resolutionNote" | "resolvedBy" | "resolvedAt"
  >
>;

export interface ReportRepository {
  insert(doc: Partial<ReportEntity>): Promise<ReportEntity>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ReportMutablePatch,
  ): Promise<void>;
  findById(id: Types.ObjectId): Promise<ReportEntity | null>;
  /** Operator queue: PENDING reports, oldest first, capped. */
  findPending(limit: number): Promise<ReportEntity[]>;
}
