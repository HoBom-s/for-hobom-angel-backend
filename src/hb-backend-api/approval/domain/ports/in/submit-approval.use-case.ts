import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";

export interface SubmitApprovalCommand {
  type: ApprovalType;
  subjectRef: string;
  requesterId: string;
}

/** Opens a pending approval request (called inside a consumer's transaction). */
export interface SubmitApprovalUseCase {
  invoke(command: SubmitApprovalCommand): Promise<ApprovalId>;
}
