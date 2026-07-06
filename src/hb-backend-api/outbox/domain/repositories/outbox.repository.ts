import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";

/** Persistence contract over the outbox collection. */
export interface OutboxRepository {
  save(entity: CreateOutboxEntity): Promise<void>;
}
