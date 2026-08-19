import { NotificationType } from "src/hb-backend-api/notification/domain/enums/notification-type.enum";

export interface NotifyCommand {
  recipientId: string;
  type: NotificationType;
  /** The target the notification points at (application id, shelter id, …). */
  subjectRef: string;
  context?: Record<string, unknown> | null;
}

/**
 * Records an in-app notification. Called by a source domain on a recipient-facing
 * transition, alongside the outbox event, inside the same transaction — so the
 * bell and the external pipeline reflect the same committed moment.
 */
export interface NotifyUseCase {
  notify(command: NotifyCommand): Promise<void>;
}
