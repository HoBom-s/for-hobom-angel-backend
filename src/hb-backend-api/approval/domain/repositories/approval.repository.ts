import { Types } from "mongoose";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
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
  /** The PENDING request for a subject (e.g. application id) and type, if any. */
  findPendingBySubjectRef(
    subjectRef: string,
    type: ApprovalType,
  ): Promise<ApprovalRequestEntity | null>;
  /** PENDING requests of a type for a shelter (`context.shelterId`), newest first. */
  findPendingByTypeAndShelter(
    type: ApprovalType,
    shelterId: string,
    limit: number,
  ): Promise<ApprovalRequestEntity[]>;
  /** Global PENDING queue (optionally one type), newest first, keyset on `_id`. */
  findPendingPage(
    type: ApprovalType | null,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<ApprovalRequestEntity[]>;
  /** PENDING request counts grouped by type. */
  countPendingByType(): Promise<{ type: ApprovalType; count: number }[]>;
  insertAction(doc: Partial<ApprovalActionEntity>): Promise<void>;
}
