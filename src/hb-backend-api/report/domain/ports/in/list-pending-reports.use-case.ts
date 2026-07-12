import { Report } from "src/hb-backend-api/report/domain/model/report";

export interface ListPendingReportsQuery {
  /** The platform operator (SYSTEM_ADMIN) viewing the queue. */
  viewerId: string;
  limit: number;
}

/** The operator moderation queue — PENDING reports, oldest first. Admin only. */
export interface ListPendingReportsUseCase {
  invoke(query: ListPendingReportsQuery): Promise<Report[]>;
}
