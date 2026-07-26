import { Page } from "src/shared/pagination/page";
import { VolunteerEventView } from "src/hb-backend-api/volunteer/domain/ports/in/read-volunteer-events.use-case";

/**
 * The member's own volunteering — their signups (all statuses) as event views,
 * newest signup first. Each view's `mySignupId`/`mySignupStatus` is that row's
 * signup, so the client renders the event plus how the application stands.
 */
export interface ListMySignupsUseCase {
  invoke(params: {
    volunteerId: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerEventView>>;
}
