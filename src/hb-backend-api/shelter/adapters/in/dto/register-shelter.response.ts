import { ApiProperty } from "@nestjs/swagger";

export class RegisterShelterResponse {
  @ApiProperty()
  shelterId: string;

  @ApiProperty({ description: "열린 검증 승인 요청 id" })
  approvalId: string;
}
