import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";

/**
 * Write-side port for the outbox. Domain use-cases call `save` INSIDE their
 * `@Transactional()` unit of work so the event is committed atomically with the
 * state change (transactional outbox). The repository enlists in the ambient
 * Mongo session automatically.
 */
export interface OutboxPersistencePort {
  save(entity: CreateOutboxEntity): Promise<void>;

  /**
   * Advance a row to SENT after the relay publishes it. Idempotent: a no-op if
   * the row is already SENT or does not exist. Returns whether a row changed.
   */
  markAsSent(eventId: string): Promise<boolean>;

  /**
   * Advance a row to FAILED after a failed publish attempt, recording the error
   * and bumping `retryCount` so the relay can retry. Returns whether a row
   * changed.
   */
  markAsFailed(eventId: string, errorMessage: string): Promise<boolean>;
}
