import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { OutboxView } from "src/hb-backend-api/outbox/domain/ports/out/outbox-query.port";

/** Fetches outbox rows for the relay to publish, by event type and status. */
export interface FindOutboxUseCase {
  invoke(eventType: EventType, status: OutboxStatus): Promise<OutboxView[]>;
}
