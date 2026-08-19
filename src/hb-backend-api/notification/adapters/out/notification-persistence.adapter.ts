import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";
import { NotificationId } from "src/hb-backend-api/notification/domain/model/vo/notification-id.vo";
import { NotificationPersistencePort } from "src/hb-backend-api/notification/domain/ports/out/notification-persistence.port";
import { NotificationRepository } from "src/hb-backend-api/notification/domain/repositories/notification.repository";
import { toInsertDoc } from "src/hb-backend-api/notification/adapters/out/notification.mapper";

@Injectable()
export class NotificationPersistenceAdapter implements NotificationPersistencePort {
  constructor(
    @Inject(DIToken.NotificationModule.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  public async create(notification: Notification): Promise<void> {
    await this.notificationRepository.insert(toInsertDoc(notification));
  }

  public async markRead(id: NotificationId, readAt: Date): Promise<void> {
    await this.notificationRepository.markRead(id.raw, readAt);
  }

  public async markAllRead(recipientId: UserId, readAt: Date): Promise<void> {
    await this.notificationRepository.markAllRead(recipientId.raw, readAt);
  }
}
