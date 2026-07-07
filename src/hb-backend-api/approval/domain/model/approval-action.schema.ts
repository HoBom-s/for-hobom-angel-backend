import { SchemaFactory } from "@nestjs/mongoose";
import { ApprovalActionEntity } from "src/hb-backend-api/approval/domain/model/approval-action.entity";

export const ApprovalActionSchema =
  SchemaFactory.createForClass(ApprovalActionEntity);

// Replay a request's history in order.
ApprovalActionSchema.index({ requestId: 1, createdAt: 1 });
