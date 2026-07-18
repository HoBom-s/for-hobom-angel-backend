import { Page } from "src/shared/pagination/page";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

/** Read-side port for volunteer posts. */
export interface VolunteerPostQueryPort {
  findById(id: VolunteerPostId): Promise<VolunteerPost | null>;
  /** The public feed — newest first, cursor-paged on `_id`. */
  findFeed(params: {
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerPost>>;
  /** Fetch posts by id (unordered); missing ids are simply absent. */
  findByIds(ids: VolunteerPostId[]): Promise<VolunteerPost[]>;
}
