import { Page } from "src/shared/pagination/page";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";

/** A post plus whether the current viewer has liked it. */
export interface VolunteerFeedItem {
  post: VolunteerPost;
  liked: boolean;
}

/** Viewer-aware reads of the volunteer post feed. */
export interface ReadVolunteerFeedUseCase {
  feed(params: {
    viewerId: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerFeedItem>>;
  one(postId: string, viewerId: string): Promise<VolunteerFeedItem | null>;
}
