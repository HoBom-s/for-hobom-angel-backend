import { SchemaFactory } from "@nestjs/mongoose";
import { ReportEntity } from "src/hb-backend-api/report/domain/model/report.entity";

export const ReportSchema = SchemaFactory.createForClass(ReportEntity);

// The operator queue (oldest pending first) and "reports about this target".
ReportSchema.index({ status: 1, createdAt: 1 });
ReportSchema.index({ targetType: 1, targetRef: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });
