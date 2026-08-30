import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiCreatedEnvelope,
  ApiEnvelope,
  ApiEnvelopeCursor,
} from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { CurrentUser } from "src/shared/auth/current-user.decorator";
import { JwtAuthGuard } from "src/shared/auth/jwt-auth.guard";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ReviewQueryPort } from "src/hb-backend-api/review/domain/ports/out/review-query.port";
import {
  SubmitReviewResult,
  SubmitReviewUseCase,
} from "src/hb-backend-api/review/domain/ports/in/submit-review.use-case";
import { ReviseReviewUseCase } from "src/hb-backend-api/review/domain/ports/in/revise-review.use-case";
import { DeleteReviewUseCase } from "src/hb-backend-api/review/domain/ports/in/delete-review.use-case";
import { SubmitReviewDto } from "src/hb-backend-api/review/adapters/in/dto/submit-review.dto";
import { ReviseReviewDto } from "src/hb-backend-api/review/adapters/in/dto/revise-review.dto";
import { ListReviewsQueryDto } from "src/hb-backend-api/review/adapters/in/dto/list-reviews.query.dto";
import { ReviewResponse } from "src/hb-backend-api/review/adapters/in/dto/review.response";
import { ShelterReputationResponse } from "src/hb-backend-api/review/adapters/in/dto/shelter-reputation.response";
import { SubmitReviewResponse } from "src/hb-backend-api/review/adapters/in/dto/submit-review.response";

@ApiTags("Reviews")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class ReviewController {
  constructor(
    @Inject(DIToken.ReviewModule.SubmitReviewUseCase)
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    @Inject(DIToken.ReviewModule.ReviseReviewUseCase)
    private readonly reviseReviewUseCase: ReviseReviewUseCase,
    @Inject(DIToken.ReviewModule.DeleteReviewUseCase)
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    @Inject(DIToken.ReviewModule.ReviewQueryPort)
    private readonly reviewQueryPort: ReviewQueryPort,
  ) {}

  @ApiOperation({ summary: "보호소 후기 작성 (완료된 입양/임보자만)" })
  @ApiCreatedEnvelope(SubmitReviewResponse)
  @Post("shelters/:shelterId/reviews")
  public submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Body() body: SubmitReviewDto,
  ): Promise<SubmitReviewResult> {
    return this.submitReviewUseCase.invoke({
      shelterId,
      authorId: user.userId,
      placementType: body.placementType,
      placementRef: body.placementRef,
      rating: body.rating,
      body: body.body,
    });
  }

  @ApiOperation({ summary: "보호소 후기 목록 (커서 페이지네이션)" })
  @ApiEnvelopeCursor(ReviewResponse)
  @Get("shelters/:shelterId/reviews")
  public async list(
    @Param("shelterId") shelterId: string,
    @Query() query: ListReviewsQueryDto,
  ): Promise<CursorPageResponse<ReviewResponse>> {
    const page = await this.reviewQueryPort.findByShelter(
      ShelterId.fromString(shelterId),
      query.cursor ?? null,
      query.limit ?? 20,
    );
    return CursorPageResponse.of(page, (review) => ReviewResponse.from(review));
  }

  @ApiOperation({ summary: "보호소 평판 (평균 별점 + 분포)" })
  @ApiEnvelope(ShelterReputationResponse)
  @Get("shelters/:shelterId/reviews/reputation")
  public async reputation(
    @Param("shelterId") shelterId: string,
  ): Promise<ShelterReputationResponse> {
    const reputation = await this.reviewQueryPort.reputationOf(
      ShelterId.fromString(shelterId),
    );
    return ShelterReputationResponse.from(reputation);
  }

  @ApiOperation({ summary: "내 후기 수정" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch("reviews/:reviewId")
  public async revise(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reviewId") reviewId: string,
    @Body() body: ReviseReviewDto,
  ): Promise<void> {
    await this.reviseReviewUseCase.invoke({
      reviewId,
      editorId: user.userId,
      rating: body.rating,
      body: body.body,
    });
  }

  @ApiOperation({ summary: "후기 삭제 (작성자 또는 운영자)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("reviews/:reviewId")
  public async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reviewId") reviewId: string,
  ): Promise<void> {
    await this.deleteReviewUseCase.invoke({
      reviewId,
      requesterId: user.userId,
    });
  }
}
