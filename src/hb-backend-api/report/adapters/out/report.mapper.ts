import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Report } from "src/hb-backend-api/report/domain/model/report";
import { ReportEntity } from "src/hb-backend-api/report/domain/model/report.entity";
import { ReportId } from "src/hb-backend-api/report/domain/model/vo/report-id.vo";
import { ReportMutablePatch } from "src/hb-backend-api/report/domain/repositories/report.repository";

export function toDomain(doc: ReportEntity): Report {
  return Report.reconstitute({
    id: ReportId.fromString(String(doc._id)),
    reporterId: UserId.fromString(String(doc.reporterId)),
    targetType: doc.targetType,
    targetRef: doc.targetRef,
    reason: doc.reason,
    detail: doc.detail ?? "",
    status: doc.status,
    resolution: doc.resolution ?? null,
    resolutionNote: doc.resolutionNote ?? null,
    resolvedBy: doc.resolvedBy
      ? UserId.fromString(String(doc.resolvedBy))
      : null,
    resolvedAt: doc.resolvedAt ?? null,
    version: doc.version ?? 0,
  });
}

export function toInsertDoc(report: Report): Partial<ReportEntity> {
  return {
    _id: report.getId.raw,
    reporterId: report.getReporterId.raw,
    targetType: report.getTargetType,
    targetRef: report.getTargetRef,
    reason: report.getReason,
    detail: report.getDetail,
    status: report.getStatus,
    version: report.getVersion,
  };
}

export function toMutablePatch(report: Report): ReportMutablePatch {
  return {
    status: report.getStatus,
    resolution: report.getResolution ?? undefined,
    resolutionNote: report.getResolutionNote ?? undefined,
    resolvedBy: report.getResolvedBy?.raw ?? undefined,
    resolvedAt: report.getResolvedAt ?? undefined,
  };
}
