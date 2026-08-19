import { Page } from "src/shared/pagination/page";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";
import { NotificationId } from "src/hb-backend-api/notification/domain/model/vo/notification-id.vo";

export interface NotificationQueryPort {
  findById(id: NotificationId): Promise<Notification | null>;
  findPageByRecipient(
    recipientId: UserId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Notification>>;
  countUnread(recipientId: UserId): Promise<number>;
}
