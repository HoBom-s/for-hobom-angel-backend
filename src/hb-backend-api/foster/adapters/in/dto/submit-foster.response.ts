import { ApiProperty } from "@nestjs/swagger";

export class SubmitFosterResponse {
  @ApiProperty()
  fosterApplicationId: string;

  @ApiProperty({ description: "열린 승인 요청 id" })
  approvalId: string;
}
