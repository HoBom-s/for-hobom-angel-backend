import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
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
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { SubmitAdoptionResponse } from "src/hb-backend-api/adoption/adapters/in/dto/submit-adoption.response";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import {
  SubmitAdoptionApplicationResult,
  SubmitAdoptionApplicationUseCase,
} from "src/hb-backend-api/adoption/domain/ports/in/submit-adoption-application.use-case";
import { ReturnAdoptionUseCase } from "src/hb-backend-api/adoption/domain/ports/in/return-adoption.use-case";
import { ListShelterAdoptionApplicationsUseCase } from "src/hb-backend-api/adoption/domain/ports/in/list-shelter-adoption-applications.use-case";
import { ListMyAdoptionApplicationsUseCase } from "src/hb-backend-api/adoption/domain/ports/in/list-my-adoption-applications.use-case";
import { GetAdoptionApplicationUseCase } from "src/hb-backend-api/adoption/domain/ports/in/get-adoption-application.use-case";
import { SubmitAdoptionApplicationDto } from "src/hb-backend-api/adoption/adapters/in/dto/submit-adoption-application.dto";
import { ReturnAdoptionDto } from "src/hb-backend-api/adoption/adapters/in/dto/return-adoption.dto";
import { ListAdoptionApplicationsQueryDto } from "src/hb-backend-api/adoption/adapters/in/dto/list-adoption-applications.query.dto";
import { AdoptionApplicationSummaryResponse } from "src/hb-backend-api/adoption/adapters/in/dto/adoption-application-summary.response";
import { AdoptionApplicationDetailResponse } from "src/hb-backend-api/adoption/adapters/in/dto/adoption-application-detail.response";

@ApiTags("Adoption")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class AdoptionController {
  constructor(
    @Inject(DIToken.AdoptionModule.SubmitAdoptionApplicationUseCase)
    private readonly submitAdoptionApplicationUseCase: SubmitAdoptionApplicationUseCase,
    @Inject(DIToken.AdoptionModule.ReturnAdoptionUseCase)
    private readonly returnAdoptionUseCase: ReturnAdoptionUseCase,
    @Inject(DIToken.AdoptionModule.ListShelterAdoptionApplicationsUseCase)
    private readonly listShelterApplicationsUseCase: ListShelterAdoptionApplicationsUseCase,
    @Inject(DIToken.AdoptionModule.ListMyAdoptionApplicationsUseCase)
    private readonly listMyApplicationsUseCase: ListMyAdoptionApplicationsUseCase,
    @Inject(DIToken.AdoptionModule.GetAdoptionApplicationUseCase)
    private readonly getApplicationUseCase: GetAdoptionApplicationUseCase,
  ) {}

  @ApiOperation({ summary: "입양 신청 (동물이 예약되고 심사가 열림)" })
  @ApiCreatedEnvelope(SubmitAdoptionResponse)
  @Post("animals/:animalId/adoption-applications")
  public submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("animalId") animalId: string,
    @Body() body: SubmitAdoptionApplicationDto,
  ): Promise<SubmitAdoptionApplicationResult> {
    return this.submitAdoptionApplicationUseCase.invoke({
      animalId,
      applicantId: user.userId,
      answers: body.answers,
    });
  }

  @ApiOperation({ summary: "입양 반환/파양 처리 (보호소 담당자)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("adoption-applications/:adoptionId/return")
  public async return(
    @CurrentUser() user: AuthenticatedUser,
    @Param("adoptionId") adoptionId: string,
    @Body() body: ReturnAdoptionDto,
  ): Promise<void> {
    await this.returnAdoptionUseCase.invoke({
      adoptionId,
      actorId: user.userId,
      reason: body.reason,
    });
  }

  @ApiOperation({ summary: "보호소 입양 신청 목록 (담당자, 상태 필터·커서)" })
  @ApiEnvelopeCursor(AdoptionApplicationSummaryResponse)
  @Get("shelters/:shelterId/adoption-applications")
  public async listForShelter(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Query() query: ListAdoptionApplicationsQueryDto,
  ): Promise<CursorPageResponse<AdoptionApplicationSummaryResponse>> {
    const page = await this.listShelterApplicationsUseCase.invoke({
      shelterId,
      actorId: user.userId,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (app) =>
      AdoptionApplicationSummaryResponse.from(app),
    );
  }

  @ApiOperation({ summary: "내 입양 신청 목록 (상태 필터·커서)" })
  @ApiEnvelopeCursor(AdoptionApplicationSummaryResponse)
  @Get("me/adoption-applications")
  public async listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAdoptionApplicationsQueryDto,
  ): Promise<CursorPageResponse<AdoptionApplicationSummaryResponse>> {
    const page = await this.listMyApplicationsUseCase.invoke({
      applicantId: user.userId,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (app) =>
      AdoptionApplicationSummaryResponse.from(app),
    );
  }

  @ApiOperation({
    summary: "입양 신청 단건 상세 (신청자 본인 또는 보호소 담당자)",
  })
  @ApiEnvelope(AdoptionApplicationDetailResponse)
  @Get("adoption-applications/:adoptionId")
  public async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("adoptionId") adoptionId: string,
  ): Promise<AdoptionApplicationDetailResponse> {
    const application = await this.getApplicationUseCase.invoke({
      applicationId: adoptionId,
      actorId: user.userId,
    });
    return AdoptionApplicationDetailResponse.from(application);
  }
}
