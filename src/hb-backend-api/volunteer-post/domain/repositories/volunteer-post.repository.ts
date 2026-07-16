import { Types } from "mongoose";
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";

/** Persistence + read contract over the volunteer_posts collection. */
export interface VolunteerPostRepository {
  insert(doc: Partial<VolunteerPostEntity>): Promise<VolunteerPostEntity>;
  deleteById(id: Types.ObjectId): Promise<void>;
  /** Atomically adjust the denormalized like tally. */
  incrementLikeCount(id: Types.ObjectId, delta: number): Promise<void>;
  /** Atomically adjust the denormalized comment tally. */
  incrementCommentCount(id: Types.ObjectId, delta: number): Promise<void>;
  findById(id: Types.ObjectId): Promise<VolunteerPostEntity | null>;
  findByIds(ids: Types.ObjectId[]): Promise<VolunteerPostEntity[]>;
  /**
   * The feed, newest first. Returns up to `limit + 1` docs so the caller can
   * detect a next page; `cursorId` is the previous page's last id (exclusive).
   */
  listFeed(
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerPostEntity[]>;
}
