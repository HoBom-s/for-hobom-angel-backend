import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";

/**
 * The staff applicant list for one event. Only staff of the event's shelter may
 * read it — a signup roster is operational data, not public.
 */
export interface ListEventSignupsUseCase {
  invoke(eventId: string, actorId: string): Promise<VolunteerSignup[]>;
}
