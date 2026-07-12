import { ApiProperty } from "@nestjs/swagger";
import { ReportReason } from "src/hb-backend-api/report/domain/enums/report-reason.enum";
import { ReportResolution } from "src/hb-backend-api/report/domain/enums/report-resolution.enum";
import { ReportStatus } from "src/hb-backend-api/report/domain/enums/report-status.enum";
import { ReportTargetType } from "src/hb-backend-api/report/domain/enums/report-target-type.enum";
import { Report } from "src/hb-backend-api/report/domain/model/report";

export class ReportResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reporterId: string;

  @ApiProperty({ enum: ReportTargetType })
  targetType: ReportTargetType;

  @ApiProperty()
  targetRef: string;

  @ApiProperty({ enum: ReportReason })
  reason: ReportReason;

  @ApiProperty()
  detail: string;

  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty({ enum: ReportResolution, nullable: true })
  resolution: ReportResolution | null;

  @ApiProperty({ nullable: true })
  resolvedAt: Date | null;

  public static from(report: Report): ReportResponse {
    const dto = new ReportResponse();
    dto.id = report.getId.toString();
    dto.reporterId = report.getReporterId.toString();
    dto.targetType = report.getTargetType;
    dto.targetRef = report.getTargetRef;
    dto.reason = report.getReason;
    dto.detail = report.getDetail;
    dto.status = report.getStatus;
    dto.resolution = report.getResolution;
    dto.resolvedAt = report.getResolvedAt;
    return dto;
  }
}
