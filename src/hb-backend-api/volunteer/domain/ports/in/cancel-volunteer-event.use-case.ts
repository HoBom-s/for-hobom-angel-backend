export interface CancelVolunteerEventCommand {
  eventId: string;
  /** The staff/admin member cancelling the event. */
  cancelledBy: string;
}

/**
 * Cancels a volunteer event. Only the owning shelter's staff/admin may cancel it.
 */
export interface CancelVolunteerEventUseCase {
  invoke(command: CancelVolunteerEventCommand): Promise<void>;
}
