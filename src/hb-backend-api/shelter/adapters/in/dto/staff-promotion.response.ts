import { ApiProperty } from "@nestjs/swagger";

export class StaffPromotionResponse {
  @ApiProperty({ description: "열린 승격 승인 요청 id" })
  approvalId: string;
}
