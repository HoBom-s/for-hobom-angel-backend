import { SchemaFactory } from "@nestjs/mongoose";
import { RetentionPolicy } from "src/shared/erasure/retention-policy";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";

const DAY_SECONDS = 86_400;

export const OutboxSchema = SchemaFactory.createForClass(OutboxEntity);

// Poller queries by (eventType, status); relay scans by status.
OutboxSchema.index({ eventType: 1, status: 1 });
OutboxSchema.index({ status: 1, createdAt: 1 });

// Retention: delivered/failed rows carry personal data (recipientUserId, etc.)
// and were previously kept forever. TTL indexes expire them once they have
// served their purpose. PENDING rows have no sentAt/failedAt, so they never
// expire (a missing indexed field is exempt from TTL).
OutboxSchema.index(
  { sentAt: 1 },
  { expireAfterSeconds: RetentionPolicy.outboxSentDays * DAY_SECONDS },
);
OutboxSchema.index(
  { failedAt: 1 },
  { expireAfterSeconds: RetentionPolicy.outboxFailedDays * DAY_SECONDS },
);
