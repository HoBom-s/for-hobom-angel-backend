import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";
import {
  NotifyCommand,
  NotifyUseCase,
} from "src/hb-backend-api/notification/domain/ports/in/notify.use-case";
import { NotificationPersistencePort } from "src/hb-backend-api/notification/domain/ports/out/notification-persistence.port";

/**
 * Records an in-app notification. Invoked by a source domain inside its own
 * transaction (the write joins the ambient Mongo session), so the notification
 * commits atomically with the transition that caused it.
 */
@Injectable()
export class NotifyService implements NotifyUseCase {
  constructor(
    @Inject(DIToken.NotificationModule.NotificationPersistencePort)
    private readonly notificationPersistencePort: NotificationPersistencePort,
  ) {}

  public async notify(command: NotifyCommand): Promise<void> {
    const notification = Notification.create({
      recipientId: UserId.fromString(command.recipientId),
      type: command.type,
      subjectRef: command.subjectRef,
      context: command.context ?? null,
    });
    await this.notificationPersistencePort.create(notification);
  }
}
