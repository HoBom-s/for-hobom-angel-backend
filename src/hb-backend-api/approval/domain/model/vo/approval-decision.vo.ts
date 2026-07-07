import { ApprovalActionType } from "src/hb-backend-api/approval/domain/enums/approval-action-type.enum";

/**
 * An operator's decision. A value object (not a bare string) so callers ask
 * `decision.isApprove()` instead of comparing string literals, and the mapping
 * to the recorded action type lives in one place.
 */
export class ApprovalDecision {
  private constructor(private readonly approve: boolean) {
    Object.freeze(this);
  }

  public static approve(): ApprovalDecision {
    return new ApprovalDecision(true);
  }

  public static reject(): ApprovalDecision {
    return new ApprovalDecision(false);
  }

  public static of(value: string): ApprovalDecision {
    switch (value) {
      case "APPROVE":
        return ApprovalDecision.approve();
      case "REJECT":
        return ApprovalDecision.reject();
      default:
        throw new Error(`알 수 없는 승인 결정이에요: ${value}`);
    }
  }

  public isApprove(): boolean {
    return this.approve;
  }

  public get actionType(): ApprovalActionType {
    return this.approve
      ? ApprovalActionType.APPROVE
      : ApprovalActionType.REJECT;
  }
}
