import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { parseCursor, toCursorPage } from "src/shared/pagination/keyset";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import {
  BookmarkRef,
  VolunteerPostBookmarkPort,
} from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-bookmark.port";
import { VolunteerPostBookmarkRepository } from "src/hb-backend-api/volunteer-post/domain/repositories/volunteer-post-bookmark.repository";

@Injectable()
export class VolunteerPostBookmarkAdapter implements VolunteerPostBookmarkPort {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostBookmarkRepository)
    private readonly repository: VolunteerPostBookmarkRepository,
  ) {}

  public add(postId: VolunteerPostId, userId: UserId): Promise<boolean> {
    return this.repository.addIfAbsent(postId.raw, userId.raw);
  }

  public remove(postId: VolunteerPostId, userId: UserId): Promise<boolean> {
    return this.repository.remove(postId.raw, userId.raw);
  }

  public async bookmarkedAmong(
    userId: UserId,
    postIds: VolunteerPostId[],
  ): Promise<Set<string>> {
    const ids = await this.repository.findBookmarkedPostIds(
      userId.raw,
      postIds.map((id) => id.raw),
    );
    return new Set(ids.map((id) => String(id)));
  }

  public async listByUser(params: {
    userId: UserId;
    cursor?: string;
    limit: number;
  }): Promise<Page<BookmarkRef>> {
    const cursorId = parseCursor(params.cursor);

    const docs = await this.repository.listByUser(
      params.userId.raw,
      cursorId,
      params.limit,
    );

    return toCursorPage(docs, params.limit, (doc) => ({
      postId: VolunteerPostId.fromString(String(doc.postId)),
      bookmarkId: String(doc._id),
    }));
  }
}
