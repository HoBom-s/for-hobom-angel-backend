import { Page } from "src/shared/pagination/page";
import { VolunteerFeedItem } from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";

/** The viewer's saved posts, most recently bookmarked first. */
export interface ListMyBookmarksUseCase {
  invoke(params: {
    viewerId: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerFeedItem>>;
}
