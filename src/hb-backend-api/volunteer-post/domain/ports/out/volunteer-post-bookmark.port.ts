import { Page } from "src/shared/pagination/page";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

/** A saved post id plus the bookmark's own id (the "my bookmarks" cursor). */
export interface BookmarkRef {
  postId: VolunteerPostId;
  bookmarkId: string;
}

/** The bookmark (save) relation between members and posts. */
export interface VolunteerPostBookmarkPort {
  /** Adds a bookmark; true only if newly added (idempotent). */
  add(postId: VolunteerPostId, userId: UserId): Promise<boolean>;
  /** Removes a bookmark; true only if one existed. */
  remove(postId: VolunteerPostId, userId: UserId): Promise<boolean>;
  /** Which of `postIds` the user has bookmarked. */
  bookmarkedAmong(
    userId: UserId,
    postIds: VolunteerPostId[],
  ): Promise<Set<string>>;
  /** A user's bookmarks, most recently saved first, cursor-paged. */
  listByUser(params: {
    userId: UserId;
    cursor?: string;
    limit: number;
  }): Promise<Page<BookmarkRef>>;
}
