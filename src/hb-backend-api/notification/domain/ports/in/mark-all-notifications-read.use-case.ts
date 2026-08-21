/** Marks all of the recipient's unread notifications as read. */
export interface MarkAllNotificationsReadUseCase {
  invoke(actorId: string): Promise<void>;
}
