import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";
import { NotificationEntity } from "src/hb-backend-api/notification/domain/model/notification.entity";
import { NotificationId } from "src/hb-backend-api/notification/domain/model/vo/notification-id.vo";
import { NotificationQueryPort } from "src/hb-backend-api/notification/domain/ports/out/notification-query.port";
import { NotificationRepository } from "src/hb-backend-api/notification/domain/repositories/notification.repository";
import { toDomain } from "src/hb-backend-api/notification/adapters/out/notification.mapper";

@Injectable()
export class NotificationQueryAdapter implements NotificationQueryPort {
  constructor(
    @Inject(DIToken.NotificationModule.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  public async findById(id: NotificationId): Promise<Notification | null> {
    const doc = await this.notificationRepository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findPageByRecipient(
    recipientId: UserId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Notification>> {
    const cursorId =
      cursor && Types.ObjectId.isValid(cursor)
        ? new Types.ObjectId(cursor)
        : null;
    const docs = await this.notificationRepository.findPageByRecipient(
      recipientId.raw,
      cursorId,
      limit,
    );
    const hasNext = docs.length > limit;
    const pageDocs = hasNext ? docs.slice(0, limit) : docs;
    const last = pageDocs[pageDocs.length - 1] as
      NotificationEntity | undefined;
    return {
      items: pageDocs.map(toDomain),
      hasNext,
      nextCursor: hasNext && last ? String(last._id) : null,
    };
  }

  public countUnread(recipientId: UserId): Promise<number> {
    return this.notificationRepository.countUnread(recipientId.raw);
  }
}
