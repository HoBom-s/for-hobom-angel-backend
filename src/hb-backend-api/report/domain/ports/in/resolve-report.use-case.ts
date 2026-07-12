import { ReportResolution } from "src/hb-backend-api/report/domain/enums/report-resolution.enum";

export interface ResolveReportCommand {
  reportId: string;
  /** The platform operator (SYSTEM_ADMIN) resolving the report. */
  resolvedBy: string;
  resolution: ReportResolution;
  note?: string;
}

/**
 * A platform operator resolves a report with a verdict. Only a SYSTEM_ADMIN may
 * resolve.
 */
export interface ResolveReportUseCase {
  invoke(command: ResolveReportCommand): Promise<void>;
}
