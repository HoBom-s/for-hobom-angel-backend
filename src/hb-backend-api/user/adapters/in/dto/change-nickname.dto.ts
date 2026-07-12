import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ChangeNicknameDto {
  @ApiProperty({ description: "2~20자의 한글/영문/숫자/_/-" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nickname: string;
}
