import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { NotificationId } from "src/hb-backend-api/notification/domain/model/vo/notification-id.vo";
import {
  MarkNotificationReadCommand,
  MarkNotificationReadUseCase,
} from "src/hb-backend-api/notification/domain/ports/in/mark-notification-read.use-case";
import { NotificationPersistencePort } from "src/hb-backend-api/notification/domain/ports/out/notification-persistence.port";
import { NotificationQueryPort } from "src/hb-backend-api/notification/domain/ports/out/notification-query.port";

@Injectable()
export class MarkNotificationReadService implements MarkNotificationReadUseCase {
  constructor(
    @Inject(DIToken.NotificationModule.NotificationQueryPort)
    private readonly notificationQueryPort: NotificationQueryPort,
    @Inject(DIToken.NotificationModule.NotificationPersistencePort)
    private readonly notificationPersistencePort: NotificationPersistencePort,
  ) {}

  public async invoke(command: MarkNotificationReadCommand): Promise<void> {
    const notificationId = NotificationId.fromString(command.notificationId);
    const notification =
      await this.notificationQueryPort.findById(notificationId);
    if (!notification) {
      throw new NotFoundException("알림을 찾을 수 없어요.");
    }
    if (!notification.isOwnedBy(UserId.fromString(command.actorId))) {
      throw new ForbiddenException("본인 알림만 읽음 처리할 수 있어요.");
    }
    await this.notificationPersistencePort.markRead(notificationId, new Date());
  }
}
