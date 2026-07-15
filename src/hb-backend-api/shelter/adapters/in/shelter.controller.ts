import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
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
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiCreatedEnvelope,
  ApiEnvelope,
  ApiEnvelopeArray,
  ApiEnvelopeCursor,
} from "src/shared/response/api-envelope.decorator";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";
import {
  RegisterShelterResult,
  RegisterShelterUseCase,
} from "src/hb-backend-api/shelter/domain/ports/in/register-shelter.use-case";
import {
  RequestStaffPromotionResult,
  RequestStaffPromotionUseCase,
} from "src/hb-backend-api/shelter/domain/ports/in/request-staff-promotion.use-case";
import { ListSheltersUseCase } from "src/hb-backend-api/shelter/domain/ports/in/list-shelters.use-case";
import { EditShelterProfileUseCase } from "src/hb-backend-api/shelter/domain/ports/in/edit-shelter-profile.use-case";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { RegisterShelterDto } from "src/hb-backend-api/shelter/adapters/in/dto/register-shelter.dto";
import { RequestStaffPromotionDto } from "src/hb-backend-api/shelter/adapters/in/dto/request-staff-promotion.dto";
import { ShelterResponse } from "src/hb-backend-api/shelter/adapters/in/dto/shelter.response";
import { ShelterMarkerResponse } from "src/hb-backend-api/shelter/adapters/in/dto/shelter-marker.response";
import { RegisterShelterResponse } from "src/hb-backend-api/shelter/adapters/in/dto/register-shelter.response";
import { StaffPromotionResponse } from "src/hb-backend-api/shelter/adapters/in/dto/staff-promotion.response";
import { ShelterListItemResponse } from "src/hb-backend-api/shelter/adapters/in/dto/shelter-list-item.response";
import { SearchSheltersQueryDto } from "src/hb-backend-api/shelter/adapters/in/dto/search-shelters.query.dto";
import { EditShelterProfileDto } from "src/hb-backend-api/shelter/adapters/in/dto/edit-shelter-profile.dto";

@ApiTags("Shelters")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/shelters`)
export class ShelterController {
  constructor(
    @Inject(DIToken.ShelterModule.RegisterShelterUseCase)
    private readonly registerShelterUseCase: RegisterShelterUseCase,
    @Inject(DIToken.ShelterModule.RequestStaffPromotionUseCase)
    private readonly requestStaffPromotionUseCase: RequestStaffPromotionUseCase,
    @Inject(DIToken.ShelterModule.ListSheltersUseCase)
    private readonly listSheltersUseCase: ListSheltersUseCase,
    @Inject(DIToken.ShelterModule.EditShelterProfileUseCase)
    private readonly editShelterProfileUseCase: EditShelterProfileUseCase,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
  ) {}

  @ApiOperation({
    summary: "보호소 등록 (등록자가 대표가 되고 검증 심사가 열림)",
  })
  @ApiCreatedEnvelope(RegisterShelterResponse)
  @Post()
  public register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RegisterShelterDto,
  ): Promise<RegisterShelterResult> {
    return this.registerShelterUseCase.invoke({
      registrantId: user.userId,
      ...body,
    });
  }

  @ApiOperation({ summary: "스태프 승격 요청 (보호소 관리자)" })
  @ApiCreatedEnvelope(StaffPromotionResponse)
  @Post(":shelterId/staff-promotions")
  public requestStaffPromotion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Body() body: RequestStaffPromotionDto,
  ): Promise<RequestStaffPromotionResult> {
    return this.requestStaffPromotionUseCase.invoke({
      shelterId,
      candidateUserId: body.candidateUserId,
      requestedBy: user.userId,
    });
  }

  @ApiOperation({
    summary: "보호소 소개(About) 수정 (§07, 소속 스태프) — 커버·소개·안내",
  })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(":shelterId/profile")
  public async editProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Body() body: EditShelterProfileDto,
  ): Promise<void> {
    await this.editShelterProfileUseCase.invoke({
      shelterId,
      editorId: user.userId,
      ...body,
    });
  }

  @ApiOperation({
    summary: "보호소 디렉터리 — 검증된 보호소 목록 (지역·이름 검색·커서)",
  })
  @ApiEnvelopeCursor(ShelterListItemResponse)
  @Get()
  public async list(
    @Query() query: SearchSheltersQueryDto,
  ): Promise<CursorPageResponse<ShelterListItemResponse>> {
    const page = await this.listSheltersUseCase.invoke({
      region: query.region,
      keyword: query.keyword,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (shelter) =>
      ShelterListItemResponse.from(shelter),
    );
  }

  @ApiOperation({ summary: "지도 탐색 — 위치 공개 보호소 마커 (지역 필터)" })
  @ApiQuery({ name: "region", required: false, type: String })
  @ApiEnvelopeArray(ShelterMarkerResponse)
  @Get("map")
  public async map(
    @Query("region") region?: string,
  ): Promise<ShelterMarkerResponse[]> {
    const shelters = await this.shelterQueryPort.findMappable(region);
    return shelters.map((shelter) => ShelterMarkerResponse.from(shelter));
  }

  @ApiOperation({ summary: "보호소 단건 조회 (슬러그)" })
  @ApiEnvelope(ShelterResponse)
  @Get(":slug")
  public async getBySlug(
    @Param("slug") slug: string,
  ): Promise<ShelterResponse> {
    const shelter = await this.shelterQueryPort.findBySlug(
      ShelterSlug.of(slug),
    );
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }
    return ShelterResponse.from(shelter);
  }
}
