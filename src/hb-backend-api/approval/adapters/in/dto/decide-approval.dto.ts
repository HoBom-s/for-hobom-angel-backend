import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString } from "class-validator";

export class DecideApprovalDto {
  @ApiProperty({ enum: ["APPROVE", "REJECT"] })
  @IsIn(["APPROVE", "REJECT"])
  decision: "APPROVE" | "REJECT";

  @ApiPropertyOptional({ description: "반려 사유(반려 시 필수)" })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description:
      "결정 메타데이터. 유형별로 콜백이 사용 (예: 보호소 검증의 { trustTier: 'A' })",
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
