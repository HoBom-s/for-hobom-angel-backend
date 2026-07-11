import { ApprovalRequestEntity } from "src/hb-backend-api/approval/domain/model/approval-request.entity";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";

export function toDomain(doc: ApprovalRequestEntity): ApprovalRequest {
  return ApprovalRequest.reconstitute({
    id: ApprovalId.fromString(String(doc._id)),
    type: doc.type,
    subjectRef: doc.subjectRef,
    requesterId: doc.requesterId,
    context: doc.context ?? null,
    status: doc.status,
    decidedBy: doc.decidedBy ?? null,
    decidedAt: doc.decidedAt ?? null,
    reason: doc.reason ?? null,
    decisionMetadata: doc.decisionMetadata ?? null,
    version: doc.version ?? 0,
  });
}
