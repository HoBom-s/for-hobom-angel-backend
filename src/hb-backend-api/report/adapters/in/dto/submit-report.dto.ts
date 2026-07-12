import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ReportReason } from "src/hb-backend-api/report/domain/enums/report-reason.enum";
import { ReportTargetType } from "src/hb-backend-api/report/domain/enums/report-target-type.enum";

export class SubmitReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiProperty({ description: "신고 대상 id (동물/보호소/회원)" })
  @IsString()
  @IsNotEmpty()
  targetRef: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  detail?: string;
}
