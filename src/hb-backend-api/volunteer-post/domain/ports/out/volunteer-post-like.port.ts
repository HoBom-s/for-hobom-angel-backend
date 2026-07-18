import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

/** The like relation between members and posts. */
export interface VolunteerPostLikePort {
  /** Adds a like; returns true only if it was newly added (idempotent). */
  add(postId: VolunteerPostId, userId: UserId): Promise<boolean>;
  /** Removes a like; returns true only if one existed and was removed. */
  remove(postId: VolunteerPostId, userId: UserId): Promise<boolean>;
  /** Which of `postIds` the user has liked. */
  likedAmong(userId: UserId, postIds: VolunteerPostId[]): Promise<Set<string>>;
}
