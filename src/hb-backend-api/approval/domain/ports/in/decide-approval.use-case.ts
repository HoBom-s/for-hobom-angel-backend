import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";

export interface DecideApprovalCommand {
  requestId: ApprovalId;
  actorId: string;
  decision: ApprovalDecision;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/** The operator's terminal decision on a pending request. */
export interface DecideApprovalUseCase {
  invoke(command: DecideApprovalCommand): Promise<void>;
}
