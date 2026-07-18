import { SchemaFactory } from "@nestjs/mongoose";
import { MessageEntity } from "src/hb-backend-api/messaging/domain/model/message.entity";

export const MessageSchema = SchemaFactory.createForClass(MessageEntity);

// A conversation's messages in order.
MessageSchema.index({ subjectType: 1, subjectRef: 1, createdAt: 1 });
// The erasure sweep tombstones a sender's messages by senderId.
MessageSchema.index({ senderId: 1 });
