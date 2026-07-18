import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerPostComment } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { VolunteerPostCommentId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-comment-id.vo";
import {
  CommentVolunteerPostUseCase,
  CreateCommentCommand,
  CreateCommentResult,
  DeleteCommentCommand,
} from "src/hb-backend-api/volunteer-post/domain/ports/in/comment-volunteer-post.use-case";
import { VolunteerPostCommentPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-comment.port";
import { VolunteerPostPersistencePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-persistence.port";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";

/**
 * Comment create/delete. Each keeps the post's denormalized commentCount in step
 * with the comment write in one transaction. Only active members may comment;
 * only the author (or a platform operator) may delete.
 */
@Injectable()
export class CommentVolunteerPostService implements CommentVolunteerPostUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostQueryPort)
    private readonly postQueryPort: VolunteerPostQueryPort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostPersistencePort)
    private readonly postPersistencePort: VolunteerPostPersistencePort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostCommentPort)
    private readonly commentPort: VolunteerPostCommentPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async create(
    command: CreateCommentCommand,
  ): Promise<CreateCommentResult> {
    const postId = VolunteerPostId.fromString(command.postId);
    const post = await this.postQueryPort.findById(postId);
    if (!post) {
      throw new NotFoundException("후기를 찾을 수 없어요.");
    }

    const author = await this.userQueryPort.findById(
      UserId.fromString(command.authorId),
    );
    if (!author || !author.isActive()) {
      throw new ForbiddenException("활성 회원만 댓글을 쓸 수 있어요.");
    }

    const comment = VolunteerPostComment.write({
      postId,
      authorId: author.getId,
      body: command.body,
    });
    await this.commentPort.create(comment);
    await this.postPersistencePort.adjustCommentCount(postId, 1);

    return { commentId: comment.getId.toString() };
  }

  @Transactional()
  public async delete(command: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentPort.findById(
      VolunteerPostCommentId.fromString(command.commentId),
    );
    if (!comment) {
      throw new NotFoundException("댓글을 찾을 수 없어요.");
    }

    const requesterId = UserId.fromString(command.requesterId);
    if (!comment.isAuthoredBy(requesterId)) {
      const actor = await this.userQueryPort.findById(requesterId);
      if (!actor?.isPlatformAdmin()) {
        throw new ForbiddenException("본인 댓글만 삭제할 수 있어요.");
      }
    }

    await this.commentPort.remove(comment);
    await this.postPersistencePort.adjustCommentCount(comment.getPostId, -1);
  }
}
