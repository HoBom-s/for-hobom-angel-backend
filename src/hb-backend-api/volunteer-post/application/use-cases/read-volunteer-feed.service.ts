import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import {
  ReadVolunteerFeedUseCase,
  VolunteerFeedItem,
} from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";
import { VolunteerPostLikePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-like.port";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";

/**
 * Reads posts and hydrates each with the viewer's `liked` flag. The like lookup
 * is a single batched query over the page's ids (not one per post).
 */
@Injectable()
export class ReadVolunteerFeedService implements ReadVolunteerFeedUseCase {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostQueryPort)
    private readonly queryPort: VolunteerPostQueryPort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostLikePort)
    private readonly likePort: VolunteerPostLikePort,
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
    const likedSet = await this.likePort.likedAmong(
      UserId.fromString(params.viewerId),
      page.items.map((post) => post.getId),
    );
    return {
      items: page.items.map((post) => ({
        post,
        liked: likedSet.has(post.getId.toString()),
      })),
      hasNext: page.hasNext,
      nextCursor: page.nextCursor,
    };
  }

  public async one(
    postId: string,
    viewerId: string,
  ): Promise<VolunteerFeedItem | null> {
    const id = VolunteerPostId.fromString(postId);
    const post = await this.queryPort.findById(id);
    if (!post) {
      return null;
    }
    const likedSet = await this.likePort.likedAmong(
      UserId.fromString(viewerId),
      [id],
    );
    return { post, liked: likedSet.has(id.toString()) };
  }
}
