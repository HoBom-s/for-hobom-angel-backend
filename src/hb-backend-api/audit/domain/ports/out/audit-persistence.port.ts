import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";

/**
 * Records a compliance audit entry. Call it from within a `@Transactional()`
 * use-case (for mutations, so the audit commits atomically with the change) or
 * standalone (for read-only VIEW_PII actions — still a durable insert).
 */
export interface AuditPersistencePort {
  record(event: AuditEvent): Promise<void>;
}
