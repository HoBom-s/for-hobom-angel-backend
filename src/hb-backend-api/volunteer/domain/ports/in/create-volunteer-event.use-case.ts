import { VolunteerType } from "src/hb-backend-api/volunteer/domain/enums/volunteer-type.enum";

export interface TransportInput {
  departure: string;
  arrival: string;
  flightAt: Date;
  animalIds: string[];
  qualification?: string;
}

export interface CreateVolunteerEventCommand {
  shelterId: string;
  /** The staff/admin member opening the event. */
  createdBy: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  /** Defaults to GENERAL when omitted. */
  type?: VolunteerType;
  /** Required for OVERSEAS, forbidden for GENERAL. */
  transport?: TransportInput;
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
