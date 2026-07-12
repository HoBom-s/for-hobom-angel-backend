import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

/** Shared by refresh (rotate) and logout (revoke) — both present a refresh token. */
export class RefreshTokenDto {
  @ApiProperty({ description: "발급받은 refresh token" })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
