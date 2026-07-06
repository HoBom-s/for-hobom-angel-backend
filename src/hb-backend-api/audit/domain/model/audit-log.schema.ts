import { SchemaFactory } from "@nestjs/mongoose";
import { AuditLogEntity } from "src/hb-backend-api/audit/domain/model/audit-log.entity";

export const AuditLogSchema = SchemaFactory.createForClass(AuditLogEntity);

// DSAR / investigation queries: "everything done to this subject", "everything
// this actor did", newest first.
AuditLogSchema.index({ subjectUserId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
