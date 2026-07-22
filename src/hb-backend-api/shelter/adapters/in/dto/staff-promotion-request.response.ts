import { ApiProperty } from "@nestjs/swagger";
import { StaffPromotionRequestView } from "src/hb-backend-api/shelter/domain/ports/in/list-staff-promotions.use-case";

/** One pending promotion card: the candidate + the approvalId to decide on. */
export class StaffPromotionRequestResponse {
  @ApiProperty({
    description: "승인 요청 id — POST /approvals/:id/decision 에 사용",
  })
  approvalId: string;

  @ApiProperty()
  candidateUserId: string;

  @ApiProperty()
  candidateNickname: string;

  @ApiProperty({ nullable: true, description: "후보 가입 시각 (가입 기간)" })
  candidateJoinedAt: Date | null;

  @ApiProperty({ description: "후보의 승인된 봉사 참여 횟수" })
  volunteerCount: number;

  public static from(
    view: StaffPromotionRequestView,
  ): StaffPromotionRequestResponse {
    const dto = new StaffPromotionRequestResponse();
    dto.approvalId = view.approvalId;
    dto.candidateUserId = view.candidateUserId;
    dto.candidateNickname = view.candidateNickname;
    dto.candidateJoinedAt = view.candidateJoinedAt;
    dto.volunteerCount = view.volunteerCount;
    return dto;
  }
}
