import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class StartInquiryDto {
  @ApiProperty({ description: "첫 문의 메시지" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
