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
import { Rating } from "src/hb-backend-api/review/domain/model/vo/rating.vo";
import { ReviewId } from "src/hb-backend-api/review/domain/model/vo/review-id.vo";
import { ReviewPersistencePort } from "src/hb-backend-api/review/domain/ports/out/review-persistence.port";
import { ReviewQueryPort } from "src/hb-backend-api/review/domain/ports/out/review-query.port";
import {
  ReviseReviewCommand,
  ReviseReviewUseCase,
} from "src/hb-backend-api/review/domain/ports/in/revise-review.use-case";

/** Edits the author's own review (rating/body). Only the author may revise. */
@Injectable()
export class ReviseReviewService implements ReviseReviewUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ReviewModule.ReviewQueryPort)
    private readonly reviewQueryPort: ReviewQueryPort,
    @Inject(DIToken.ReviewModule.ReviewPersistencePort)
    private readonly reviewPersistencePort: ReviewPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: ReviseReviewCommand): Promise<void> {
    const review = await this.reviewQueryPort.findById(
      ReviewId.fromString(command.reviewId),
    );
    if (!review) {
      throw new NotFoundException("후기를 찾을 수 없어요.");
    }
    if (!review.isAuthoredBy(UserId.fromString(command.editorId))) {
      throw new ForbiddenException("본인의 후기만 수정할 수 있어요.");
    }

    review.revise(Rating.of(command.rating), command.body);
    await this.reviewPersistencePort.save(review);
  }
}
