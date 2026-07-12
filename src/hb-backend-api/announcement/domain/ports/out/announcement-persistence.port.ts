import { Announcement } from "src/hb-backend-api/announcement/domain/model/announcement";

/** Write-side port for the announcement aggregate. */
export interface AnnouncementPersistencePort {
  create(announcement: Announcement): Promise<Announcement>;
  /** Persists an edited notice (title/body/pin) under optimistic concurrency. */
  save(announcement: Announcement): Promise<void>;
  remove(announcement: Announcement): Promise<void>;
}
