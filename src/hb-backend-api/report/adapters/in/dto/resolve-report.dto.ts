import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ReportResolution } from "src/hb-backend-api/report/domain/enums/report-resolution.enum";

export class ResolveReportDto {
  @ApiProperty({ enum: ReportResolution })
  @IsEnum(ReportResolution)
  resolution: ReportResolution;

  @ApiPropertyOptional({ description: "처리 메모" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
