import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";

/**
 * A type-specific completion handler. When a request reaches a terminal
 * decision, the engine invokes this — inside the decision's transaction — to
 * transition the target domain aggregate (e.g. verify a shelter and grant its
 * admin). Consumers register one per {@link ApprovalType}.
 */
export interface ApprovalCallback {
  readonly type: ApprovalType;
  onApproved(request: ApprovalRequest): Promise<void>;
  onRejected(request: ApprovalRequest): Promise<void>;
}
