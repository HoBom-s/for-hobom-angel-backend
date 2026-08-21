import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";
import { NotificationPersistencePort } from "src/hb-backend-api/notification/domain/ports/out/notification-persistence.port";
import { NotificationQueryPort } from "src/hb-backend-api/notification/domain/ports/out/notification-query.port";
import { MarkNotificationReadService } from "src/hb-backend-api/notification/application/use-cases/mark-notification-read.service";

const notificationId = "6a65ed6d9579767bbe907e0b";
const actorId = "6a65ed6d9579767bbe907e1c";

const build = (notification: Notification | null) => {
  const notificationQueryPort = {
    findById: jest.fn().mockResolvedValue(notification),
  } as unknown as jest.Mocked<NotificationQueryPort>;
  const notificationPersistencePort = {
    markRead: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<NotificationPersistencePort>;
  return {
    service: new MarkNotificationReadService(
      notificationQueryPort,
      notificationPersistencePort,
    ),
    notificationPersistencePort,
  };
};

describe("MarkNotificationReadService", () => {
  const cmd = { notificationId, actorId };

  it("marks the notification read for its owner", async () => {
    const { service, notificationPersistencePort } = build({
      isOwnedBy: () => true,
    } as unknown as Notification);

    await service.invoke(cmd);

    expect(notificationPersistencePort.markRead).toHaveBeenCalledTimes(1);
  });

  it("forbids marking someone else's notification", async () => {
    const { service, notificationPersistencePort } = build({
      isOwnedBy: () => false,
    } as unknown as Notification);

    await expect(service.invoke(cmd)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(notificationPersistencePort.markRead).not.toHaveBeenCalled();
  });

  it("404s when the notification does not exist", async () => {
    const { service } = build(null);
    await expect(service.invoke(cmd)).rejects.toBeInstanceOf(NotFoundException);
  });
});
