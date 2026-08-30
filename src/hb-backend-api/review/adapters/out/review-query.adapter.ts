import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { parseCursor, toCursorPage } from "src/shared/pagination/keyset";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";
import { Review } from "src/hb-backend-api/review/domain/model/review";
import { ReviewId } from "src/hb-backend-api/review/domain/model/vo/review-id.vo";
import { ShelterReputation } from "src/hb-backend-api/review/domain/model/shelter-reputation";
import { ReviewQueryPort } from "src/hb-backend-api/review/domain/ports/out/review-query.port";
import { ReviewRepository } from "src/hb-backend-api/review/domain/repositories/review.repository";
import { toDomain } from "src/hb-backend-api/review/adapters/out/review.mapper";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

@Injectable()
export class ReviewQueryAdapter implements ReviewQueryPort {
  constructor(
    @Inject(DIToken.ReviewModule.ReviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  public async findById(id: ReviewId): Promise<Review | null> {
    const doc = await this.reviewRepository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByShelter(
    shelterId: ShelterId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Review>> {
    const cursorId = parseCursor(cursor);

    const docs = await this.reviewRepository.findByShelter(
      shelterId.raw,
      cursorId,
      limit,
    );

    return toCursorPage(docs, limit, toDomain);
  }

  public hasReviewedPlacement(
    authorId: UserId,
    placementType: PlacementType,
    placementRef: string,
  ): Promise<boolean> {
    return this.reviewRepository.existsByPlacement(
      authorId.raw,
      placementType,
      new Types.ObjectId(placementRef),
    );
  }

  public reputationOf(shelterId: ShelterId): Promise<ShelterReputation> {
    return this.reviewRepository.summarizeByShelter(shelterId.raw);
  }
}
