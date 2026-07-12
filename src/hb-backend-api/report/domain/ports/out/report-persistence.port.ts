import { Report } from "src/hb-backend-api/report/domain/model/report";

/** Write-side port for reports. */
export interface ReportPersistencePort {
  create(report: Report): Promise<void>;
  save(report: Report): Promise<void>;
}
