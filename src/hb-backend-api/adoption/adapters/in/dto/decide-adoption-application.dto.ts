import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

/** A shelter's decision on an adoption application. */
export class DecideAdoptionApplicationDto {
  @ApiProperty({ enum: ["APPROVE", "REJECT"] })
  @IsIn(["APPROVE", "REJECT"])
  decision: "APPROVE" | "REJECT";

  @ApiPropertyOptional({ description: "반려 사유 (반려 시 권장)" })
  @IsOptional()
  @IsString()
  reason?: string;
}
