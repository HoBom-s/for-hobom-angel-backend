import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ description: "본인확인 벤더 인증 영수증(토큰)" })
  @IsString()
  @IsNotEmpty()
  verificationToken: string;
}
