import { Prop, Schema } from "@nestjs/mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";

@Schema({ collection: "approval_requests", timestamps: true })
export class ApprovalRequestEntity extends BaseEntity {
  @Prop({ required: true, enum: ApprovalType, type: String })
  public type: ApprovalType;

  @Prop({ required: true })
  public subjectRef: string;

  @Prop({ required: true })
  public requesterId: string;

  @Prop({ type: Object })
  public context?: Record<string, unknown>;

  @Prop({
    required: true,
    enum: ApprovalStatus,
    type: String,
    default: ApprovalStatus.PENDING,
  })
  public status: ApprovalStatus;

  @Prop({ type: String })
  public decidedBy?: string;

  @Prop({ type: Date })
  public decidedAt?: Date;

  @Prop({ type: String })
  public reason?: string;

  @Prop({ type: Object })
  public decisionMetadata?: Record<string, unknown>;

  @Prop({ required: true, default: 0 })
  public version: number;
}
