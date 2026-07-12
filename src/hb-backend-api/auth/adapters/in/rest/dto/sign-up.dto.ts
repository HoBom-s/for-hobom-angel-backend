import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class SignUpDto {
  @ApiProperty({ description: "본인확인 벤더 인증 영수증(토큰)" })
  @IsString()
  @IsNotEmpty()
  verificationToken: string;

  @ApiProperty({ description: "2~20자의 한글/영문/숫자/_/-" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nickname: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}
