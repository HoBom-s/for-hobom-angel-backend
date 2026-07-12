import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class SignUpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    description:
      "8자 이상, 영문/숫자/특수문자 포함 권장 (bcrypt 72바이트 한도)",
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ description: "2~20자의 한글/영문/숫자/_/-" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nickname: string;

  @ApiProperty({ description: "실명 (자기기입)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  realName: string;

  @ApiProperty({ description: "휴대폰 번호 (숫자만, 010XXXXXXXX)" })
  @IsString()
  @Matches(/^010\d{8}$/, { message: "휴대폰 번호 형식이 올바르지 않아요." })
  phone: string;
}
