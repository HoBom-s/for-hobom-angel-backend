import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Review } from "src/hb-backend-api/review/domain/model/review";
import { ReviewPersistencePort } from "src/hb-backend-api/review/domain/ports/out/review-persistence.port";
import { ReviewRepository } from "src/hb-backend-api/review/domain/repositories/review.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/review/adapters/out/review.mapper";

@Injectable()
export class ReviewPersistenceAdapter implements ReviewPersistencePort {
  constructor(
    @Inject(DIToken.ReviewModule.ReviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  public async create(review: Review): Promise<Review> {
    await this.reviewRepository.insert(toInsertDoc(review));
    return review;
  }

  public async save(review: Review): Promise<void> {
    await this.reviewRepository.update(
      review.getId.raw,
      review.getVersion,
      toMutablePatch(review),
    );
  }

  public async remove(review: Review): Promise<void> {
    await this.reviewRepository.deleteById(review.getId.raw);
  }
}
