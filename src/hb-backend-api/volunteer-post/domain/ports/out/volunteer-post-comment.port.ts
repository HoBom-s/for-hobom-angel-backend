import { Page } from "src/shared/pagination/page";
import { VolunteerPostComment } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment";
import { VolunteerPostCommentId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-comment-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

/** Read + write port for volunteer post comments. */
export interface VolunteerPostCommentPort {
  create(comment: VolunteerPostComment): Promise<void>;
  remove(comment: VolunteerPostComment): Promise<void>;
  findById(id: VolunteerPostCommentId): Promise<VolunteerPostComment | null>;
  /** A post's comment thread, oldest first, cursor-paged on `_id`. */
  listByPost(params: {
    postId: VolunteerPostId;
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerPostComment>>;
}
