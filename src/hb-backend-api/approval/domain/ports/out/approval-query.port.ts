import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";

export interface ApprovalQueryPort {
  findById(id: ApprovalId): Promise<ApprovalRequest | null>;
  /**
   * PENDING requests of a type whose `context.shelterId` matches — e.g. a
   * shelter's staff-promotion queue. Newest first, bounded by `limit`.
   */
  findPendingByTypeAndShelter(
    type: ApprovalType,
    shelterId: string,
    limit: number,
  ): Promise<ApprovalRequest[]>;
}
