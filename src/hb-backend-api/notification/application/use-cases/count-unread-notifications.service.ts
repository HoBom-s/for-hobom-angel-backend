import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { CountUnreadNotificationsUseCase } from "src/hb-backend-api/notification/domain/ports/in/count-unread-notifications.use-case";
import { NotificationQueryPort } from "src/hb-backend-api/notification/domain/ports/out/notification-query.port";

@Injectable()
export class CountUnreadNotificationsService implements CountUnreadNotificationsUseCase {
  constructor(
    @Inject(DIToken.NotificationModule.NotificationQueryPort)
    private readonly notificationQueryPort: NotificationQueryPort,
  ) {}

  public invoke(recipientId: string): Promise<number> {
    return this.notificationQueryPort.countUnread(
      UserId.fromString(recipientId),
    );
  }
}
