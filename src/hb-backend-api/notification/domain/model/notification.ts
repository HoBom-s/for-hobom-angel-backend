import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { NotificationType } from "src/hb-backend-api/notification/domain/enums/notification-type.enum";
import { NotificationId } from "src/hb-backend-api/notification/domain/model/vo/notification-id.vo";

/**
 * An in-app notification for a recipient. Created alongside the recipient-facing
 * outbox event on a domain transition, and read/marked-read by the owner via the
 * bell. `subjectRef` + `context` let the client render text and deep-link
 * without the notification domain knowing each source domain's internals.
 */
export class Notification {
  private constructor(
    private readonly id: NotificationId,
    private readonly recipientId: UserId,
    private readonly type: NotificationType,
    private readonly subjectRef: string,
    private readonly context: Record<string, unknown> | null,
    private readAt: Date | null,
    private readonly createdAt: Date | null,
  ) {}

  public static create(params: {
    recipientId: UserId;
    type: NotificationType;
    subjectRef: string;
    context?: Record<string, unknown> | null;
  }): Notification {
    return new Notification(
      NotificationId.generate(),
      params.recipientId,
      params.type,
      params.subjectRef,
      params.context ?? null,
      null,
      null,
    );
  }

  public static reconstitute(params: {
    id: NotificationId;
    recipientId: UserId;
    type: NotificationType;
    subjectRef: string;
    context: Record<string, unknown> | null;
    readAt: Date | null;
    createdAt: Date | null;
  }): Notification {
    return new Notification(
      params.id,
      params.recipientId,
      params.type,
      params.subjectRef,
      params.context,
      params.readAt,
      params.createdAt,
    );
  }

  /** Idempotent: marking an already-read notification keeps the first time. */
  public markRead(now: Date): void {
    if (this.readAt === null) {
      this.readAt = now;
    }
  }

  public isOwnedBy(userId: UserId): boolean {
    return this.recipientId.equals(userId);
  }

  public isRead(): boolean {
    return this.readAt !== null;
  }

  public get getId(): NotificationId {
    return this.id;
  }
  public get getRecipientId(): UserId {
    return this.recipientId;
  }
  public get getType(): NotificationType {
    return this.type;
  }
  public get getSubjectRef(): string {
    return this.subjectRef;
  }
  public get getContext(): Record<string, unknown> | null {
    return this.context;
  }
  public get getReadAt(): Date | null {
    return this.readAt;
  }
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
}
