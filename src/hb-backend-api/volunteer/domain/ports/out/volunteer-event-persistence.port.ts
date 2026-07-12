import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";

/** Write-side port for volunteer events. Enlists in the ambient Mongo session. */
export interface VolunteerEventPersistencePort {
  create(event: VolunteerEvent): Promise<void>;
  save(event: VolunteerEvent): Promise<void>;
}
