import { Announcement } from "src/hb-backend-api/announcement/domain/model/announcement";
import { AnnouncementId } from "src/hb-backend-api/announcement/domain/model/vo/announcement-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

/** Read-side port for shelter announcements. */
export interface AnnouncementQueryPort {
  findById(id: AnnouncementId): Promise<Announcement | null>;
  /** A shelter's notice board, pinned first then newest, capped at `limit`. */
  findByShelter(shelterId: ShelterId, limit: number): Promise<Announcement[]>;
}
