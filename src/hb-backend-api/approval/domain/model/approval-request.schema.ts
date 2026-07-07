import { SchemaFactory } from "@nestjs/mongoose";
import { ApprovalRequestEntity } from "src/hb-backend-api/approval/domain/model/approval-request.entity";

export const ApprovalRequestSchema = SchemaFactory.createForClass(
  ApprovalRequestEntity,
);

// Operator queues by (type, status); "requests about this subject" by subjectRef.
ApprovalRequestSchema.index({ type: 1, status: 1, createdAt: -1 });
ApprovalRequestSchema.index({ subjectRef: 1, type: 1 });
