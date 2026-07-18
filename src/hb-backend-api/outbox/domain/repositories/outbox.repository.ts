import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { OutboxView } from "src/hb-backend-api/outbox/domain/ports/out/outbox-query.port";

/** Persistence contract over the outbox collection. */
export interface OutboxRepository {
  save(entity: CreateOutboxEntity): Promise<void>;

  findByEventTypeAndStatus(
    eventType: EventType,
    status: OutboxStatus,
  ): Promise<OutboxView[]>;

  markAsSent(eventId: string): Promise<boolean>;

  markAsFailed(eventId: string, errorMessage: string): Promise<boolean>;
}
