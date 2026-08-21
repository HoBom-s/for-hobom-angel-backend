import { SchemaFactory } from "@nestjs/mongoose";
import { NotificationEntity } from "src/hb-backend-api/notification/domain/model/notification.entity";

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationEntity);

// A recipient's feed, newest first.
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
// Unread count / unread-first queries.
NotificationSchema.index({ recipientId: 1, readAt: 1 });
