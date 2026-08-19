import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";
import { NotificationId } from "src/hb-backend-api/notification/domain/model/vo/notification-id.vo";

export interface NotificationPersistencePort {
  create(notification: Notification): Promise<void>;
  markRead(id: NotificationId, readAt: Date): Promise<void>;
  markAllRead(recipientId: UserId, readAt: Date): Promise<void>;
}
