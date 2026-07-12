import { ReportReason } from "src/hb-backend-api/report/domain/enums/report-reason.enum";
import { ReportTargetType } from "src/hb-backend-api/report/domain/enums/report-target-type.enum";

export interface SubmitReportCommand {
  /** The reporting member. */
  reporterId: string;
  targetType: ReportTargetType;
  targetRef: string;
  reason: ReportReason;
  detail?: string;
}

export interface SubmitReportResult {
  reportId: string;
}

/** Files a report of an animal, shelter, or user into the operator queue. */
export interface SubmitReportUseCase {
  invoke(command: SubmitReportCommand): Promise<SubmitReportResult>;
}
