import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { MarkAllNotificationsReadUseCase } from "src/hb-backend-api/notification/domain/ports/in/mark-all-notifications-read.use-case";
import { NotificationPersistencePort } from "src/hb-backend-api/notification/domain/ports/out/notification-persistence.port";

@Injectable()
export class MarkAllNotificationsReadService implements MarkAllNotificationsReadUseCase {
  constructor(
    @Inject(DIToken.NotificationModule.NotificationPersistencePort)
    private readonly notificationPersistencePort: NotificationPersistencePort,
  ) {}

  public async invoke(actorId: string): Promise<void> {
    await this.notificationPersistencePort.markAllRead(
      UserId.fromString(actorId),
      new Date(),
    );
  }
}
