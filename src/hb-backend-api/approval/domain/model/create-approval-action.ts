import { ApprovalActionType } from "src/hb-backend-api/approval/domain/enums/approval-action-type.enum";

/**
 * One append-only entry in a request's history — who did what, and why. The
 * sequence of actions IS the audit trail ("누가 언제 무엇을 승인").
 */
export class CreateApprovalAction {
  private constructor(
    public readonly requestId: string,
    public readonly actorId: string,
    public readonly action: ApprovalActionType,
    public readonly reason: string | null,
  ) {}

  public static of(params: {
    requestId: string;
    actorId: string;
    action: ApprovalActionType;
    reason?: string | null;
  }): CreateApprovalAction {
    if (!params.requestId?.trim() || !params.actorId?.trim()) {
      throw new Error("액션에는 requestId와 actorId가 필요해요.");
    }
    return new CreateApprovalAction(
      params.requestId,
      params.actorId,
      params.action,
      params.reason?.trim() || null,
    );
  }
}
