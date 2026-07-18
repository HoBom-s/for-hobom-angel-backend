import { SchemaFactory } from "@nestjs/mongoose";
import { ErasureRequestEntity } from "src/shared/erasure/erasure-request.entity";

export const ErasureRequestSchema =
  SchemaFactory.createForClass(ErasureRequestEntity);

// The worker (PR2) claims by status; DSAR/status reads look up by subject.
ErasureRequestSchema.index({ status: 1 });
ErasureRequestSchema.index({ subjectId: 1 });
