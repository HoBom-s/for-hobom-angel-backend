import { Page } from "src/shared/pagination/page";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";

/**
 * An event plus the viewer's own live signup for it, if any. `mySignupId` is the
 * id the client needs to withdraw; `mySignupStatus` distinguishes 승인 대기 from
 * 승인됨. Both null when the viewer hasn't signed up (or was rejected/withdrew).
 */
export interface VolunteerEventView {
  event: VolunteerEvent;
  mySignupId: string | null;
  mySignupStatus: VolunteerSignupStatus | null;
}

/** Viewer-aware reads of volunteer events (attach the caller's signup state). */
export interface ReadVolunteerEventsUseCase {
  byShelter(
    shelterId: string,
    viewerId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<VolunteerEventView>>;
  upcoming(viewerId: string, limit: number): Promise<VolunteerEventView[]>;
  one(eventId: string, viewerId: string): Promise<VolunteerEventView | null>;
}
