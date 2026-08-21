import { Types } from "mongoose";
import { NotificationEntity } from "src/hb-backend-api/notification/domain/model/notification.entity";

export interface NotificationRepository {
  insert(doc: Partial<NotificationEntity>): Promise<void>;
  findById(id: Types.ObjectId): Promise<NotificationEntity | null>;
  /** Newest-first keyset page of a recipient's notifications (`_id < cursor`). */
  findPageByRecipient(
    recipientId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<NotificationEntity[]>;
  countUnread(recipientId: Types.ObjectId): Promise<number>;
  markRead(id: Types.ObjectId, readAt: Date): Promise<void>;
  markAllRead(recipientId: Types.ObjectId, readAt: Date): Promise<void>;
}
