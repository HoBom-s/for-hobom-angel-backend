import { Page } from "src/shared/pagination/page";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";

export interface ListPendingApprovalsQuery {
  /** The caller — must be a platform operator (SYSTEM_ADMIN). */
  viewerId: string;
  type?: ApprovalType;
  cursor?: string;
  limit: number;
}

/** The operator's global pending-approval queue (all shelters). Operator only. */
export interface ListPendingApprovalsUseCase {
  invoke(query: ListPendingApprovalsQuery): Promise<Page<ApprovalRequest>>;
}
