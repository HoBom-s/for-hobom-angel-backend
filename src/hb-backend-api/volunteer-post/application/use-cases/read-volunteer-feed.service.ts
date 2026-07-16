import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import {
  ReadVolunteerFeedUseCase,
  VolunteerFeedItem,
} from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";
import { VolunteerPostBookmarkPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-bookmark.port";
import { VolunteerPostLikePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-like.port";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";

/**
 * Reads posts and hydrates each with the viewer's own `liked` / `bookmarked`
 * flags. Each flag is a single batched query over the page's ids (not one per
 * post), so a page costs three queries total regardless of size.
 */
@Injectable()
export class ReadVolunteerFeedService implements ReadVolunteerFeedUseCase {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostQueryPort)
    private readonly queryPort: VolunteerPostQueryPort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostLikePort)
    private readonly likePort: VolunteerPostLikePort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostBookmarkPort)
    private readonly bookmarkPort: VolunteerPostBookmarkPort,
  ) {}

  public async feed(params: {
    viewerId: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerFeedItem>> {
    const page = await this.queryPort.findFeed({
      cursor: params.cursor,
      limit: params.limit,
    });
    const items = await this.toItems(page.items, params.viewerId);
    return { items, hasNext: page.hasNext, nextCursor: page.nextCursor };
  }

  public async one(
    postId: string,
    viewerId: string,
  ): Promise<VolunteerFeedItem | null> {
    const post = await this.queryPort.findById(
      VolunteerPostId.fromString(postId),
    );
    if (!post) {
      return null;
    }
    const [item] = await this.toItems([post], viewerId);
    return item;
  }

  /** Batch-hydrate the viewer's liked/bookmarked flags over a set of posts. */
  private async toItems(
    posts: VolunteerPost[],
    viewerId: string,
  ): Promise<VolunteerFeedItem[]> {
    if (posts.length === 0) {
      return [];
    }
    const viewer = UserId.fromString(viewerId);
    const ids = posts.map((post) => post.getId);
    const [likedSet, bookmarkedSet] = await Promise.all([
      this.likePort.likedAmong(viewer, ids),
      this.bookmarkPort.bookmarkedAmong(viewer, ids),
    ]);
    return posts.map((post) => ({
      post,
      liked: likedSet.has(post.getId.toString()),
      bookmarked: bookmarkedSet.has(post.getId.toString()),
    }));
  }
}
