import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";
import { NotificationEntity } from "src/hb-backend-api/notification/domain/model/notification.entity";
import { NotificationId } from "src/hb-backend-api/notification/domain/model/vo/notification-id.vo";

export function toDomain(doc: NotificationEntity): Notification {
  return Notification.reconstitute({
    id: NotificationId.fromString(String(doc._id)),
    recipientId: UserId.fromString(String(doc.recipientId)),
    type: doc.type,
    subjectRef: doc.subjectRef,
    context: doc.context ?? null,
    readAt: doc.readAt ?? null,
    createdAt: doc.createdAt ?? null,
  });
}

export function toInsertDoc(
  notification: Notification,
): Partial<NotificationEntity> {
  return {
    _id: notification.getId.raw,
    recipientId: notification.getRecipientId.raw,
    type: notification.getType,
    subjectRef: notification.getSubjectRef,
    context: notification.getContext,
    readAt: notification.getReadAt,
  };
}
