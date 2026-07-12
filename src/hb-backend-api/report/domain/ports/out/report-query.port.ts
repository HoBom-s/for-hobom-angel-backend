import { Report } from "src/hb-backend-api/report/domain/model/report";
import { ReportId } from "src/hb-backend-api/report/domain/model/vo/report-id.vo";

/** Read-side port for reports. */
export interface ReportQueryPort {
  findById(id: ReportId): Promise<Report | null>;
  findPending(limit: number): Promise<Report[]>;
}
