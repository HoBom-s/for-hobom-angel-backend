import { SchemaFactory } from "@nestjs/mongoose";
import { MessageEntity } from "src/hb-backend-api/messaging/domain/model/message.entity";

export const MessageSchema = SchemaFactory.createForClass(MessageEntity);

// A conversation's messages in order.
MessageSchema.index({ subjectType: 1, subjectRef: 1, createdAt: 1 });
