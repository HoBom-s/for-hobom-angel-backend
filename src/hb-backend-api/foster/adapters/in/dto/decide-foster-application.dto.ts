import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

/** A shelter's decision on a foster application. */
export class DecideFosterApplicationDto {
  @ApiProperty({ enum: ["APPROVE", "REJECT"] })
  @IsIn(["APPROVE", "REJECT"])
  decision: "APPROVE" | "REJECT";

  @ApiPropertyOptional({ description: "반려 사유 (반려 시 권장)" })
  @IsOptional()
  @IsString()
  reason?: string;
}
