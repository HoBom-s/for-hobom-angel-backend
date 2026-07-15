import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";

/**
 * A persisted outbox row as seen by the relay (read side). The payload stays an
 * opaque record here — the gRPC layer discriminates it into a typed proto union
 * by {@link eventType}.
 */
export interface OutboxView {
  id: string;
  eventId: string;
  eventType: EventType;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  retryCount: number;
  sentAt: Date | null;
  failedAt: Date | null;
  lastError: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Read-side port for the outbox relay. hobom-event-processor polls rows by event
 * type and status to publish them to Kafka.
 */
export interface OutboxQueryPort {
  findByEventTypeAndStatus(
    eventType: EventType,
    status: OutboxStatus,
  ): Promise<OutboxView[]>;
}
