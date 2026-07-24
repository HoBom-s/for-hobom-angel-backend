import { ApiProperty } from "@nestjs/swagger";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";

/** Pending counts per type — the operator queue's tab badges. */
export class PendingApprovalCountsResponse {
  @ApiProperty()
  SHELTER_VERIFICATION: number;

  @ApiProperty()
  STAFF_PROMOTION: number;

  @ApiProperty()
  ADOPTION: number;

  @ApiProperty()
  FOSTER: number;

  public static from(
    counts: Record<ApprovalType, number>,
  ): PendingApprovalCountsResponse {
    const dto = new PendingApprovalCountsResponse();
    dto.SHELTER_VERIFICATION = counts[ApprovalType.SHELTER_VERIFICATION];
    dto.STAFF_PROMOTION = counts[ApprovalType.STAFF_PROMOTION];
    dto.ADOPTION = counts[ApprovalType.ADOPTION];
    dto.FOSTER = counts[ApprovalType.FOSTER];
    return dto;
  }
}
