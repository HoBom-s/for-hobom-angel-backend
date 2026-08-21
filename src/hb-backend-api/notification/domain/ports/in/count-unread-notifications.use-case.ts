/** The recipient's unread notification count (bell badge). */
export interface CountUnreadNotificationsUseCase {
  invoke(recipientId: string): Promise<number>;
}
