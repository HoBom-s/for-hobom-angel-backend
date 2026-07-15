import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

/**
 * Refresh (rotate) and logout (revoke) read the refresh token from the httpOnly
 * `refreshToken` cookie. This body field is an optional fallback for non-browser
 * callers (e.g. direct API testing).
 */
export class RefreshTokenDto {
  @ApiPropertyOptional({ description: "쿠키가 없을 때만 사용하는 대체 값" })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
