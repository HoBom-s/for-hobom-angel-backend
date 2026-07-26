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
  /**
   * Authorizes the actor to decide THIS request before any mutation. The engine
   * is domain-agnostic, so each type declares its own decider here (operator vs.
   * the target shelter's staff). MUST throw (ForbiddenException) when the actor
   * is not permitted. Called by the engine before {@link onApproved}/
   * {@link onRejected}, inside the decision transaction.
   */
  authorize(request: ApprovalRequest, actorId: string): Promise<void>;
  onApproved(request: ApprovalRequest): Promise<void>;
  onRejected(request: ApprovalRequest): Promise<void>;
}
