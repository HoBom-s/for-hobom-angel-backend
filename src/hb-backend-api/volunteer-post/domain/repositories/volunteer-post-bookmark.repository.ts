import { Types } from "mongoose";
import { VolunteerPostBookmarkEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-bookmark.entity";

/** Persistence for the volunteer_post_bookmarks join collection. */
export interface VolunteerPostBookmarkRepository {
  /** Upsert a bookmark; true if newly inserted. */
  addIfAbsent(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
  /** Delete a bookmark; true if one was removed. */
  remove(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
  /** The subset of `postIds` this user has bookmarked. */
  findBookmarkedPostIds(
    userId: Types.ObjectId,
    postIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]>;
  /**
   * A user's bookmarks, most recently saved first. Returns up to `limit + 1`
   * docs; `cursorId` is the previous page's last bookmark id (exclusive).
   */
  listByUser(
    userId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerPostBookmarkEntity[]>;
}
