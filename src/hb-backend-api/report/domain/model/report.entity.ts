import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { ReportReason } from "src/hb-backend-api/report/domain/enums/report-reason.enum";
import { ReportResolution } from "src/hb-backend-api/report/domain/enums/report-resolution.enum";
import { ReportStatus } from "src/hb-backend-api/report/domain/enums/report-status.enum";
import { ReportTargetType } from "src/hb-backend-api/report/domain/enums/report-target-type.enum";

@Schema({ collection: "reports", timestamps: true })
export class ReportEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public reporterId: Types.ObjectId;

  @Prop({ required: true, enum: ReportTargetType, type: String })
  public targetType: ReportTargetType;

  @Prop({ required: true })
  public targetRef: string;

  @Prop({ required: true, enum: ReportReason, type: String })
  public reason: ReportReason;

  @Prop({ default: "" })
  public detail: string;

  @Prop({
    required: true,
    enum: ReportStatus,
    type: String,
    default: ReportStatus.PENDING,
  })
  public status: ReportStatus;

  @Prop({ enum: ReportResolution, type: String, default: null })
  public resolution?: ReportResolution | null;

  @Prop({ type: String, default: null })
  public resolutionNote?: string | null;

  @Prop({ type: Types.ObjectId, ref: "users", default: null })
  public resolvedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  public resolvedAt?: Date | null;

  @Prop({ required: true, default: 0 })
  public version: number;
}
