import { ApiProperty } from "@nestjs/swagger";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";

/**
 * One pending request in the operator queue. Type-agnostic: `subjectRef` is the
 * target entity id and `context` the submit-time payload (both type-specific);
 * the client renders per type. Feed `approvalId` to POST /approvals/:id/decision.
 */
export class PendingApprovalResponse {
  @ApiProperty()
  approvalId: string;

  @ApiProperty({ enum: ApprovalType })
  type: ApprovalType;

  @ApiProperty({
    description:
      "결정 대상 엔티티 id (유형별: shelterId · candidateUserId · applicationId 등)",
  })
  subjectRef: string;

  @ApiProperty({ description: "요청을 연 사용자 id" })
  requesterId: string;

  @ApiProperty({
    type: Object,
    nullable: true,
    description: "제출 시점 컨텍스트 (유형별, 예: { shelterId, animalId })",
  })
  context: Record<string, unknown> | null;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(request: ApprovalRequest): PendingApprovalResponse {
    const dto = new PendingApprovalResponse();
    dto.approvalId = request.getId.toString();
    dto.type = request.getType;
    dto.subjectRef = request.getSubjectRef;
    dto.requesterId = request.getRequesterId;
    dto.context = request.getContext;
    dto.createdAt = request.getCreatedAt;
    return dto;
  }
}
