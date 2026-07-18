/**
 * Advances an outbox row after a relay publish attempt. Both operations are
 * keyed by `eventId` and return whether a row actually changed (false when the
 * row is missing or already in a terminal state).
 */
export interface MarkOutboxSentUseCase {
  invoke(eventId: string): Promise<boolean>;
}

export interface MarkOutboxFailedUseCase {
  invoke(eventId: string, errorMessage: string): Promise<boolean>;
}
