import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Review } from "src/hb-backend-api/review/domain/model/review";
import { Rating } from "src/hb-backend-api/review/domain/model/vo/rating.vo";
import { PlacementEligibilityPort } from "src/hb-backend-api/review/domain/ports/out/placement-eligibility.port";
import { ReviewPersistencePort } from "src/hb-backend-api/review/domain/ports/out/review-persistence.port";
import { ReviewQueryPort } from "src/hb-backend-api/review/domain/ports/out/review-query.port";
import {
  SubmitReviewCommand,
  SubmitReviewResult,
  SubmitReviewUseCase,
} from "src/hb-backend-api/review/domain/ports/in/submit-review.use-case";

/**
 * Writes a shelter review only if the author owns a completed placement at that
 * shelter — the anti-fake-review guard. The (author, placement) pair is unique,
 * so each completed adoption/foster yields at most one review.
 */
@Injectable()
export class SubmitReviewService implements SubmitReviewUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ReviewModule.PlacementEligibilityPort)
    private readonly placementEligibilityPort: PlacementEligibilityPort,
    @Inject(DIToken.ReviewModule.ReviewQueryPort)
    private readonly reviewQueryPort: ReviewQueryPort,
    @Inject(DIToken.ReviewModule.ReviewPersistencePort)
    private readonly reviewPersistencePort: ReviewPersistencePort,
  ) {}

  @Transactional()
  public async invoke(
    command: SubmitReviewCommand,
  ): Promise<SubmitReviewResult> {
    const placement = await this.placementEligibilityPort.find(
      command.placementType,
      command.placementRef,
    );
    if (!placement) {
      throw new NotFoundException("입양/임보 내역을 찾을 수 없어요.");
    }
    if (placement.adopterId !== command.authorId) {
      throw new ForbiddenException(
        "본인의 입양/임보 내역에만 후기를 남길 수 있어요.",
      );
    }
    if (placement.shelterId !== command.shelterId) {
      throw new BadRequestException("후기 대상 보호소가 일치하지 않아요.");
    }
    if (!placement.completed) {
      throw new BadRequestException(
        "완료된 입양/임보에 대해서만 후기를 남길 수 있어요.",
      );
    }

    const authorId = UserId.fromString(command.authorId);
    if (
      await this.reviewQueryPort.hasReviewedPlacement(
        authorId,
        command.placementType,
        command.placementRef,
      )
    ) {
      throw new ConflictException("이미 후기를 남겼어요.");
    }

    const review = Review.write({
      shelterId: ShelterId.fromString(command.shelterId),
      authorId,
      placementType: command.placementType,
      placementRef: command.placementRef,
      rating: Rating.of(command.rating),
      body: command.body,
    });
    await this.reviewPersistencePort.create(review);

    return { reviewId: review.getId.toString() };
  }
}
