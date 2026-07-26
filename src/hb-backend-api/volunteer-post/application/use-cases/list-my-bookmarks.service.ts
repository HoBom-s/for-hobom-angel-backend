import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { ListMyBookmarksUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/list-my-bookmarks.use-case";
import { VolunteerFeedItem } from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";
import { VolunteerPostBookmarkPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-bookmark.port";
import { VolunteerPostLikePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-like.port";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";

/**
 * The viewer's saved posts as full feed items. Fetches the bookmark page, then
 * the posts by id (preserving bookmark order; a since-deleted post drops out),
 * and hydrates the viewer's `liked` flag. `bookmarked` is trivially true here.
 */
@Injectable()
export class ListMyBookmarksService implements ListMyBookmarksUseCase {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostBookmarkPort)
    private readonly bookmarkPort: VolunteerPostBookmarkPort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostQueryPort)
    private readonly queryPort: VolunteerPostQueryPort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostLikePort)
    private readonly likePort: VolunteerPostLikePort,
  ) {}

  public async invoke(params: {
    viewerId: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerFeedItem>> {
    const viewer = UserId.fromString(params.viewerId);
    const page = await this.bookmarkPort.listByUser({
      userId: viewer,
      cursor: params.cursor,
      limit: params.limit,
    });

    const orderedIds = page.items.map((ref) => ref.postId);
    const posts = await this.queryPort.findByIds(orderedIds);
    const byId = new Map<string, VolunteerPost>(
      posts.map((post) => [post.getId.toString(), post]),
    );
    // Preserve bookmark order; skip posts that were since deleted.
    const ordered = orderedIds
      .map((id) => byId.get(id.toString()))
      .filter((post): post is VolunteerPost => post !== undefined);

    const likedSet = await this.likePort.likedAmong(
      viewer,
      ordered.map((post) => post.getId),
    );

    return {
      items: ordered.map((post) => ({
        post,
        liked: likedSet.has(post.getId.toString()),
        bookmarked: true,
      })),
      hasNext: page.hasNext,
      nextCursor: page.nextCursor,
    };
  }
}
