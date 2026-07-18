import { SchemaFactory } from "@nestjs/mongoose";
import { RetentionPolicy } from "src/shared/erasure/retention-policy";
import { ErasureRequestEntity } from "src/shared/erasure/erasure-request.entity";

export const ErasureRequestSchema =
  SchemaFactory.createForClass(ErasureRequestEntity);

// The worker claims by status; DSAR/status reads look up by subject.
ErasureRequestSchema.index({ status: 1 });
ErasureRequestSchema.index({ subjectId: 1 });
// Retention: keep the erasure evidence for the policy window, then TTL it out.
ErasureRequestSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: RetentionPolicy.erasureRequestDays * 86_400 },
);
