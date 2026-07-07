import { Types } from "mongoose";
import { ApprovalActionEntity } from "src/hb-backend-api/approval/domain/model/approval-action.entity";
import { ApprovalRequestEntity } from "src/hb-backend-api/approval/domain/model/approval-request.entity";

export type ApprovalDecisionPatch = Partial<
  Pick<
    ApprovalRequestEntity,
    "status" | "decidedBy" | "decidedAt" | "reason" | "decisionMetadata"
  >
>;

export interface ApprovalRepository {
  insertRequest(doc: Partial<ApprovalRequestEntity>): Promise<void>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  updateRequest(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ApprovalDecisionPatch,
  ): Promise<void>;
  findRequestById(id: Types.ObjectId): Promise<ApprovalRequestEntity | null>;
  insertAction(doc: Partial<ApprovalActionEntity>): Promise<void>;
}
