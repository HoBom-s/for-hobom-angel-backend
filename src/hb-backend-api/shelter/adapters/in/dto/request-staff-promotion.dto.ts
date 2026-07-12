import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RequestStaffPromotionDto {
  @ApiProperty({ description: "스태프로 승격할 회원 id" })
  @IsString()
  @IsNotEmpty()
  candidateUserId: string;
}
