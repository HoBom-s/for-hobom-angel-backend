import { Prop, Schema } from "@nestjs/mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { ApprovalActionType } from "src/hb-backend-api/approval/domain/enums/approval-action-type.enum";

/** Append-only. The ordered actions of a request are its audit history. */
@Schema({ collection: "approval_actions", timestamps: true })
export class ApprovalActionEntity extends BaseEntity {
  @Prop({ required: true })
  public requestId: string;

  @Prop({ required: true })
  public actorId: string;

  @Prop({ required: true, enum: ApprovalActionType, type: String })
  public action: ApprovalActionType;

  @Prop({ type: String })
  public reason?: string;
}
