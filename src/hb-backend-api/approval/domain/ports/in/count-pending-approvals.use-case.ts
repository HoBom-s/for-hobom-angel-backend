import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";

export interface CountPendingApprovalsQuery {
  /** The caller — must be a platform operator (SYSTEM_ADMIN). */
  viewerId: string;
}

/** Pending counts per approval type — the operator queue's tab badges. */
export interface CountPendingApprovalsUseCase {
  invoke(
    query: CountPendingApprovalsQuery,
  ): Promise<Record<ApprovalType, number>>;
}
