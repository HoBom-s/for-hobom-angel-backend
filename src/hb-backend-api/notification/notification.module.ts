import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { NotificationEntity } from "src/hb-backend-api/notification/domain/model/notification.entity";
import { NotificationSchema } from "src/hb-backend-api/notification/domain/model/notification.schema";
import { NotificationController } from "src/hb-backend-api/notification/adapters/in/notification.controller";
import { NotifyService } from "src/hb-backend-api/notification/application/use-cases/notify.service";
import { ListMyNotificationsService } from "src/hb-backend-api/notification/application/use-cases/list-my-notifications.service";
import { CountUnreadNotificationsService } from "src/hb-backend-api/notification/application/use-cases/count-unread-notifications.service";
import { MarkNotificationReadService } from "src/hb-backend-api/notification/application/use-cases/mark-notification-read.service";
import { MarkAllNotificationsReadService } from "src/hb-backend-api/notification/application/use-cases/mark-all-notifications-read.service";
import { NotificationPersistenceAdapter } from "src/hb-backend-api/notification/adapters/out/notification-persistence.adapter";
import { NotificationQueryAdapter } from "src/hb-backend-api/notification/adapters/out/notification-query.adapter";
import { NotificationRepositoryImpl } from "src/hb-backend-api/notification/infra/repositories/notification.repository.impl";

/**
 * In-app notifications (the bell). Source domains record notifications via the
 * exported {@link NotifyService} inside their own transaction (atomic with the
 * transition); recipients read/mark-read them here. The external email/push
 * pipeline stays separate (outbox → relay → internal-backend).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationEntity.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    {
      provide: DIToken.NotificationModule.NotifyUseCase,
      useClass: NotifyService,
    },
    {
      provide: DIToken.NotificationModule.ListMyNotificationsUseCase,
      useClass: ListMyNotificationsService,
    },
    {
      provide: DIToken.NotificationModule.CountUnreadNotificationsUseCase,
      useClass: CountUnreadNotificationsService,
    },
    {
      provide: DIToken.NotificationModule.MarkNotificationReadUseCase,
      useClass: MarkNotificationReadService,
    },
    {
      provide: DIToken.NotificationModule.MarkAllNotificationsReadUseCase,
      useClass: MarkAllNotificationsReadService,
    },
    {
      provide: DIToken.NotificationModule.NotificationRepository,
      useClass: NotificationRepositoryImpl,
    },
    {
      provide: DIToken.NotificationModule.NotificationPersistencePort,
      useClass: NotificationPersistenceAdapter,
    },
    {
      provide: DIToken.NotificationModule.NotificationQueryPort,
      useClass: NotificationQueryAdapter,
    },
  ],
  exports: [DIToken.NotificationModule.NotifyUseCase],
})
export class NotificationModule {}
