import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class DsarRequestDto {
  @ApiPropertyOptional({
    description: "처리 사유 — 감사 기록(EXPORT_PII / DELETE_PII)에 남습니다.",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  public reason?: string;
}
