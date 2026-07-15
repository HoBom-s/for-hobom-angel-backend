import { Types } from "mongoose";
import { AnnouncementEntity } from "src/hb-backend-api/announcement/domain/model/announcement.entity";

/** Mutable fields a shelter's staff may edit after posting. */
export type AnnouncementMutablePatch = Partial<
  Pick<AnnouncementEntity, "title" | "body" | "pinned">
>;

/** Persistence + read contract over the shelter_announcements collection. */
export interface AnnouncementRepository {
  insert(doc: Partial<AnnouncementEntity>): Promise<AnnouncementEntity>;
  /** Version-guarded update (OCC). Throws OptimisticLockException on a miss. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: AnnouncementMutablePatch,
  ): Promise<void>;
  deleteById(id: Types.ObjectId): Promise<void>;
  findById(id: Types.ObjectId): Promise<AnnouncementEntity | null>;
  /** A shelter's notices, pinned first then newest, capped at `limit`. */
  findByShelter(
    shelterId: Types.ObjectId,
    limit: number,
  ): Promise<AnnouncementEntity[]>;
}
