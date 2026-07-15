import { Types } from "mongoose";

/** Persistence for the volunteer_post_likes join collection. */
export interface VolunteerPostLikeRepository {
  /** Upsert a like; true if newly inserted. */
  addIfAbsent(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
  /** Delete a like; true if one was removed. */
  remove(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
  /** The subset of `postIds` this user has liked. */
  findLikedPostIds(
    userId: Types.ObjectId,
    postIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]>;
}
