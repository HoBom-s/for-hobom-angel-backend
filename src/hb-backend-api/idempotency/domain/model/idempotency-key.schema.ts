import { SchemaFactory } from "@nestjs/mongoose";
import { IdempotencyKeyEntity } from "src/hb-backend-api/idempotency/domain/model/idempotency-key.entity";

export const IdempotencyKeySchema =
  SchemaFactory.createForClass(IdempotencyKeyEntity);

// One reservation per (scope, key) — the unique index is what enforces
// at-most-once. Keys self-expire after 24h so the collection stays bounded.
IdempotencyKeySchema.index({ scope: 1, key: 1 }, { unique: true });
IdempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86_400 });
