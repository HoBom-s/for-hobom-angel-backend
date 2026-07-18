import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";

/** Persistence contract over the audit_logs collection. */
export interface AuditRepository {
  save(event: AuditEvent): Promise<void>;
  /** Legal-retention sweep: delete audit logs older than `cutoff`. Rows purged. */
  purgeOlderThan(cutoff: Date): Promise<number>;
}
