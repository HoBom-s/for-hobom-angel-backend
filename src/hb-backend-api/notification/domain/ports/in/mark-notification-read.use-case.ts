export interface MarkNotificationReadCommand {
  notificationId: string;
  /** The recipient marking it read — must own the notification. */
  actorId: string;
}

export interface MarkNotificationReadUseCase {
  invoke(command: MarkNotificationReadCommand): Promise<void>;
}
