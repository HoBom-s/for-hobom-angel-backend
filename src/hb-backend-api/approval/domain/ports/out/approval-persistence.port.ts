import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { CreateApprovalAction } from "src/hb-backend-api/approval/domain/model/create-approval-action";

export interface ApprovalPersistencePort {
  create(request: ApprovalRequest): Promise<void>;
  /** Persists a decided request with an optimistic-lock guard. */
  save(request: ApprovalRequest): Promise<void>;
  appendAction(action: CreateApprovalAction): Promise<void>;
}
