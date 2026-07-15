import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

/** Write-side port for the volunteer post aggregate. */
export interface VolunteerPostPersistencePort {
  create(post: VolunteerPost): Promise<VolunteerPost>;
  remove(post: VolunteerPost): Promise<void>;
  /** Atomically adjust a post's denormalized like tally. */
  adjustLikeCount(postId: VolunteerPostId, delta: number): Promise<void>;
}
