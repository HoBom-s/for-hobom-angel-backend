export interface CreateVolunteerEventCommand {
  shelterId: string;
  /** The staff/admin member opening the event. */
  createdBy: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
}

export interface CreateVolunteerEventResult {
  eventId: string;
}

/**
 * Opens a volunteer event under a verified shelter. Only that shelter's
 * staff/admin may create it.
 */
export interface CreateVolunteerEventUseCase {
  invoke(
    command: CreateVolunteerEventCommand,
  ): Promise<CreateVolunteerEventResult>;
}
