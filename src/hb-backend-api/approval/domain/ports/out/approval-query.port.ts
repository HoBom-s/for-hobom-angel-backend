import { Page } from "src/shared/pagination/page";
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
  /**
   * The operator's global PENDING queue across all shelters — optionally one
   * type, newest first, cursor-paged.
   */
  findPending(
    type: ApprovalType | null,
    cursor: string | null,
    limit: number,
  ): Promise<Page<ApprovalRequest>>;
  /** PENDING counts per type (operator tab badges); every type present, 0 if none. */
  countPendingByType(): Promise<Record<ApprovalType, number>>;
}
