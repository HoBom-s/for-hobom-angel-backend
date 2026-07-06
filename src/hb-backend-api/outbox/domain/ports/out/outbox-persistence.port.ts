import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";

/**
 * Write-side port for the outbox. Domain use-cases call `save` INSIDE their
 * `@Transactional()` unit of work so the event is committed atomically with the
 * state change (transactional outbox). The repository enlists in the ambient
 * Mongo session automatically.
 */
export interface OutboxPersistencePort {
  save(entity: CreateOutboxEntity): Promise<void>;
}
