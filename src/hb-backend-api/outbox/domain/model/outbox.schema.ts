import { SchemaFactory } from "@nestjs/mongoose";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";

export const OutboxSchema = SchemaFactory.createForClass(OutboxEntity);

// Poller queries by (eventType, status); relay scans by status.
OutboxSchema.index({ eventType: 1, status: 1 });
OutboxSchema.index({ status: 1, createdAt: 1 });
