import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";

export interface ApprovalQueryPort {
  findById(id: ApprovalId): Promise<ApprovalRequest | null>;
}
