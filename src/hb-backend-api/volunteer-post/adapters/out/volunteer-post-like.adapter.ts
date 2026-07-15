import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { VolunteerPostLikePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-like.port";
import { VolunteerPostLikeRepository } from "src/hb-backend-api/volunteer-post/domain/repositories/volunteer-post-like.repository";

@Injectable()
export class VolunteerPostLikeAdapter implements VolunteerPostLikePort {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostLikeRepository)
    private readonly repository: VolunteerPostLikeRepository,
  ) {}

  public add(postId: VolunteerPostId, userId: UserId): Promise<boolean> {
    return this.repository.addIfAbsent(postId.raw, userId.raw);
  }

  public remove(postId: VolunteerPostId, userId: UserId): Promise<boolean> {
    return this.repository.remove(postId.raw, userId.raw);
  }

  public async likedAmong(
    userId: UserId,
    postIds: VolunteerPostId[],
  ): Promise<Set<string>> {
    const liked = await this.repository.findLikedPostIds(
      userId.raw,
      postIds.map((id) => id.raw),
    );
    return new Set(liked.map((id) => String(id)));
  }
}
