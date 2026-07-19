import { Page } from "src/shared/pagination/page";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";

/** Read-side port for volunteer events. */
export interface VolunteerEventQueryPort {
  findById(id: VolunteerEventId): Promise<VolunteerEvent | null>;
  /** Fetch events by id (unordered); missing ids are simply absent. */
  findByIds(ids: VolunteerEventId[]): Promise<VolunteerEvent[]>;
  /** A shelter's events, cursor-paginated newest-first. */
  findByShelter(
    shelterId: ShelterId,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<VolunteerEvent>>;
  findUpcoming(now: Date, limit: number): Promise<VolunteerEvent[]>;
  /** OPEN events past their end time — the auto-close sweep's candidates. */
  findExpiredOpen(now: Date, limit: number): Promise<VolunteerEvent[]>;
}
