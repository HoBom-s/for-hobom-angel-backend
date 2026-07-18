import { Types } from "mongoose";
import { VolunteerPostCommentEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment.entity";

/** Persistence + read contract over the volunteer_post_comments collection. */
export interface VolunteerPostCommentRepository {
  insert(doc: Partial<VolunteerPostCommentEntity>): Promise<void>;
  deleteById(id: Types.ObjectId): Promise<void>;
  findById(id: Types.ObjectId): Promise<VolunteerPostCommentEntity | null>;
  /**
   * A post's comments, oldest first. Returns up to `limit + 1` so the caller can
   * detect a next page; `cursorId` is the previous page's last id (exclusive).
   */
  listByPost(
    postId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerPostCommentEntity[]>;
}
