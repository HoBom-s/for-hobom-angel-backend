import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import {
  LikeVolunteerPostCommand,
  LikeVolunteerPostUseCase,
} from "src/hb-backend-api/volunteer-post/domain/ports/in/like-volunteer-post.use-case";
import { VolunteerPostLikePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-like.port";
import { VolunteerPostPersistencePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-persistence.port";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";

/**
 * Toggles a like. The join insert/delete and the post's denormalized likeCount
 * are updated in one transaction; the count only moves when the like actually
 * changed (idempotent), so double-taps never skew it.
 */
@Injectable()
export class LikeVolunteerPostService implements LikeVolunteerPostUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostQueryPort)
    private readonly queryPort: VolunteerPostQueryPort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostLikePort)
    private readonly likePort: VolunteerPostLikePort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostPersistencePort)
    private readonly persistencePort: VolunteerPostPersistencePort,
  ) {}

  @Transactional()
  public async like(command: LikeVolunteerPostCommand): Promise<void> {
    const postId = VolunteerPostId.fromString(command.postId);
    const post = await this.queryPort.findById(postId);
    if (!post) {
      throw new NotFoundException("후기를 찾을 수 없어요.");
    }

    const added = await this.likePort.add(
      postId,
      UserId.fromString(command.userId),
    );
    if (added) {
      await this.persistencePort.adjustLikeCount(postId, 1);
    }
  }

  @Transactional()
  public async unlike(command: LikeVolunteerPostCommand): Promise<void> {
    const postId = VolunteerPostId.fromString(command.postId);
    const removed = await this.likePort.remove(
      postId,
      UserId.fromString(command.userId),
    );
    if (removed) {
      await this.persistencePort.adjustLikeCount(postId, -1);
    }
  }
}
