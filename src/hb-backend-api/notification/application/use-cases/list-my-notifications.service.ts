import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";
import {
  ListMyNotificationsQuery,
  ListMyNotificationsUseCase,
} from "src/hb-backend-api/notification/domain/ports/in/list-my-notifications.use-case";
import { NotificationQueryPort } from "src/hb-backend-api/notification/domain/ports/out/notification-query.port";

@Injectable()
export class ListMyNotificationsService implements ListMyNotificationsUseCase {
  constructor(
    @Inject(DIToken.NotificationModule.NotificationQueryPort)
    private readonly notificationQueryPort: NotificationQueryPort,
  ) {}

  public invoke(query: ListMyNotificationsQuery): Promise<Page<Notification>> {
    return this.notificationQueryPort.findPageByRecipient(
      UserId.fromString(query.recipientId),
      query.cursor ?? null,
      query.limit,
    );
  }
}
