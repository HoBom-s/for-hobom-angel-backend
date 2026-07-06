import { Prop, Schema } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { BaseEntity } from "src/shared/base/base.entity";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";

/**
 * Transactional outbox row. Written inside the same Mongo transaction as the
 * domain state change (PENDING), then polled over gRPC by hobom-event-processor
 * and published to Kafka. `version` supports optimistic updates on transition.
 */
@Schema({ collection: "outbox" })
export class OutboxEntity extends BaseEntity {
  @Prop({ required: true, unique: true, default: () => randomUUID() })
  public eventId: string;

  @Prop({ required: true, enum: EventType, type: String })
  public eventType: EventType;

  @Prop({ required: true, type: Object })
  public payload: Record<string, unknown>;

  @Prop({
    required: true,
    enum: OutboxStatus,
    type: String,
    default: OutboxStatus.PENDING,
  })
  public status: OutboxStatus;

  @Prop({ required: true, default: 0 })
  public retryCount: number;

  @Prop({ type: Date })
  public sentAt?: Date;

  @Prop({ type: Date })
  public failedAt?: Date;

  @Prop({ type: String })
  public lastError?: string;

  @Prop({ required: true, default: 1 })
  public version: number;
}
