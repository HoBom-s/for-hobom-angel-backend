import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureModule } from "src/shared/erasure/erasure.module";
import { AdoptionModule } from "src/hb-backend-api/adoption/adoption.module";
import { FosterModule } from "src/hb-backend-api/foster/foster.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { ReviewDestroyer } from "src/hb-backend-api/review/adapters/erasure/review.destroyer";
import { ReviewEntity } from "src/hb-backend-api/review/domain/model/review.entity";
import { ReviewSchema } from "src/hb-backend-api/review/domain/model/review.schema";
import { ReviewRepositoryImpl } from "src/hb-backend-api/review/infra/repositories/review.repository.impl";
import { ReviewPersistenceAdapter } from "src/hb-backend-api/review/adapters/out/review-persistence.adapter";
import { ReviewQueryAdapter } from "src/hb-backend-api/review/adapters/out/review-query.adapter";
import { PlacementEligibilityAdapter } from "src/hb-backend-api/review/adapters/out/placement-eligibility.adapter";
import { SubmitReviewService } from "src/hb-backend-api/review/application/use-cases/submit-review.service";
import { ReviseReviewService } from "src/hb-backend-api/review/application/use-cases/revise-review.service";
import { DeleteReviewService } from "src/hb-backend-api/review/application/use-cases/delete-review.service";
import { ReviewController } from "src/hb-backend-api/review/adapters/in/review.controller";

/**
 * 후기·평판 — members who completed an adoption/foster review the shelter; the
 * reviews roll up into a reputation (average + star distribution). Authorship is
 * gated by a real placement (see {@link PlacementEligibilityAdapter}), so ratings
 * come only from people who actually dealt with the shelter.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReviewEntity.name, schema: ReviewSchema },
    ]),
    UserModule,
    AdoptionModule,
    FosterModule,
    ErasureModule,
  ],
  controllers: [ReviewController],
  providers: [
    ReviewDestroyer,
    {
      provide: DIToken.ReviewModule.SubmitReviewUseCase,
      useClass: SubmitReviewService,
    },
    {
      provide: DIToken.ReviewModule.ReviseReviewUseCase,
      useClass: ReviseReviewService,
    },
    {
      provide: DIToken.ReviewModule.DeleteReviewUseCase,
      useClass: DeleteReviewService,
    },
    {
      provide: DIToken.ReviewModule.ReviewRepository,
      useClass: ReviewRepositoryImpl,
    },
    {
      provide: DIToken.ReviewModule.ReviewPersistencePort,
      useClass: ReviewPersistenceAdapter,
    },
    {
      provide: DIToken.ReviewModule.ReviewQueryPort,
      useClass: ReviewQueryAdapter,
    },
    {
      provide: DIToken.ReviewModule.PlacementEligibilityPort,
      useClass: PlacementEligibilityAdapter,
    },
  ],
})
export class ReviewModule implements OnModuleInit {
  constructor(
    private readonly destroyerRegistry: DestroyerRegistry,
    private readonly reviewDestroyer: ReviewDestroyer,
  ) {}

  public onModuleInit(): void {
    this.destroyerRegistry.register(this.reviewDestroyer);
  }
}
