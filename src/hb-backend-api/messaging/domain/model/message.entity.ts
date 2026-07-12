import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";

@Schema({ collection: "messages", timestamps: true })
export class MessageEntity extends BaseEntity {
  @Prop({ required: true, enum: MessageSubjectType, type: String })
  public subjectType: MessageSubjectType;

  @Prop({ required: true })
  public subjectRef: string;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public senderId: Types.ObjectId;

  @Prop({ required: true, enum: MessageSenderRole, type: String })
  public senderRole: MessageSenderRole;

  @Prop({ required: true })
  public body: string;
}
