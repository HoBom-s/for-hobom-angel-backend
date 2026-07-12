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
import { ReviewId } from "src/hb-backend-api/review/domain/model/vo/review-id.vo";
import { ReviewPersistencePort } from "src/hb-backend-api/review/domain/ports/out/review-persistence.port";
import { ReviewQueryPort } from "src/hb-backend-api/review/domain/ports/out/review-query.port";
import {
  DeleteReviewCommand,
  DeleteReviewUseCase,
} from "src/hb-backend-api/review/domain/ports/in/delete-review.use-case";

/**
 * Removes a review. The author may delete their own; a platform operator may
 * remove any (moderation). Hard delete — reputation recomputes on the next read.
 */
@Injectable()
export class DeleteReviewService implements DeleteReviewUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ReviewModule.ReviewQueryPort)
    private readonly reviewQueryPort: ReviewQueryPort,
    @Inject(DIToken.ReviewModule.ReviewPersistencePort)
    private readonly reviewPersistencePort: ReviewPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: DeleteReviewCommand): Promise<void> {
    const review = await this.reviewQueryPort.findById(
      ReviewId.fromString(command.reviewId),
    );
    if (!review) {
      throw new NotFoundException("후기를 찾을 수 없어요.");
    }

    const requesterId = UserId.fromString(command.requesterId);
    if (!review.isAuthoredBy(requesterId)) {
      const requester = await this.userQueryPort.findById(requesterId);
      if (!requester?.isPlatformAdmin()) {
        throw new ForbiddenException("본인의 후기만 삭제할 수 있어요.");
      }
    }

    await this.reviewPersistencePort.remove(review);
  }
}
