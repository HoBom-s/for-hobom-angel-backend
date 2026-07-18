import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import {
  BookmarkVolunteerPostCommand,
  BookmarkVolunteerPostUseCase,
} from "src/hb-backend-api/volunteer-post/domain/ports/in/bookmark-volunteer-post.use-case";
import { VolunteerPostBookmarkPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-bookmark.port";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";

/**
 * Toggles a private bookmark. Idempotent in both directions — the unique index
 * keeps a save from doubling and a delete is a no-op if it wasn't saved. No
 * denormalized count (bookmarks are private), so no transaction is needed.
 */
@Injectable()
export class BookmarkVolunteerPostService implements BookmarkVolunteerPostUseCase {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostQueryPort)
    private readonly queryPort: VolunteerPostQueryPort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostBookmarkPort)
    private readonly bookmarkPort: VolunteerPostBookmarkPort,
  ) {}

  public async bookmark(command: BookmarkVolunteerPostCommand): Promise<void> {
    const postId = VolunteerPostId.fromString(command.postId);
    const post = await this.queryPort.findById(postId);
    if (!post) {
      throw new NotFoundException("후기를 찾을 수 없어요.");
    }
    await this.bookmarkPort.add(postId, UserId.fromString(command.userId));
  }

  public async unbookmark(
    command: BookmarkVolunteerPostCommand,
  ): Promise<void> {
    await this.bookmarkPort.remove(
      VolunteerPostId.fromString(command.postId),
      UserId.fromString(command.userId),
    );
  }
}
