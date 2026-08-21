import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { NotificationType } from "src/hb-backend-api/notification/domain/enums/notification-type.enum";

@Schema({ collection: "notifications", timestamps: true })
export class NotificationEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public recipientId: Types.ObjectId;

  @Prop({ required: true, enum: NotificationType, type: String })
  public type: NotificationType;

  @Prop({ required: true })
  public subjectRef: string;

  @Prop({ type: Object, default: null })
  public context: Record<string, unknown> | null;

  @Prop({ type: Date, default: null })
  public readAt: Date | null;
}
