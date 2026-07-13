export interface CloseExpiredVolunteerEventsResult {
  closed: number;
}

/** Auto-closes OPEN volunteer events whose end time has passed (scheduled sweep). */
export interface CloseExpiredVolunteerEventsUseCase {
  invoke(): Promise<CloseExpiredVolunteerEventsResult>;
}
