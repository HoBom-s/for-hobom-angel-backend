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
import { Public } from "src/hb-backend-api/auth/adapters/in/rest/decorator/public.decorator";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
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
import { GetShelterStaffUseCase } from "src/hb-backend-api/shelter/domain/ports/in/get-shelter-staff.use-case";
import { GetShelterVerificationUseCase } from "src/hb-backend-api/shelter/domain/ports/in/get-shelter-verification.use-case";
import { ListStaffPromotionsUseCase } from "src/hb-backend-api/shelter/domain/ports/in/list-staff-promotions.use-case";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { RegisterShelterDto } from "src/hb-backend-api/shelter/adapters/in/dto/register-shelter.dto";
import { RequestStaffPromotionDto } from "src/hb-backend-api/shelter/adapters/in/dto/request-staff-promotion.dto";
import { ShelterResponse } from "src/hb-backend-api/shelter/adapters/in/dto/shelter.response";
import { ShelterMarkerResponse } from "src/hb-backend-api/shelter/adapters/in/dto/shelter-marker.response";
import { RegisterShelterResponse } from "src/hb-backend-api/shelter/adapters/in/dto/register-shelter.response";
import { StaffPromotionResponse } from "src/hb-backend-api/shelter/adapters/in/dto/staff-promotion.response";
import { ShelterListItemResponse } from "src/hb-backend-api/shelter/adapters/in/dto/shelter-list-item.response";
import { StaffMemberResponse } from "src/hb-backend-api/shelter/adapters/in/dto/staff-member.response";
import { StaffPromotionRequestResponse } from "src/hb-backend-api/shelter/adapters/in/dto/staff-promotion-request.response";
import { SearchSheltersQueryDto } from "src/hb-backend-api/shelter/adapters/in/dto/search-shelters.query.dto";
import { EditShelterProfileDto } from "src/hb-backend-api/shelter/adapters/in/dto/edit-shelter-profile.dto";
import { ShelterVerificationResponse } from "src/hb-backend-api/shelter/adapters/in/dto/shelter-verification.response";

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
    @Inject(DIToken.ShelterModule.GetShelterStaffUseCase)
    private readonly getShelterStaffUseCase: GetShelterStaffUseCase,
    @Inject(DIToken.ShelterModule.GetShelterVerificationUseCase)
    private readonly getShelterVerificationUseCase: GetShelterVerificationUseCase,
    @Inject(DIToken.ShelterModule.ListStaffPromotionsUseCase)
    private readonly listStaffPromotionsUseCase: ListStaffPromotionsUseCase,
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
    summary: "대기 중인 스태프 승격 요청 큐 (담당자) — 후보·봉사·가입기간",
  })
  @ApiEnvelopeArray(StaffPromotionRequestResponse)
  @Get(":shelterId/staff-promotions")
  public async listStaffPromotions(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
  ): Promise<StaffPromotionRequestResponse[]> {
    const views = await this.listStaffPromotionsUseCase.invoke({
      shelterId,
      actorId: user.userId,
    });
    return views.map((view) => StaffPromotionRequestResponse.from(view));
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
  @Public()
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
  @Public()
  @Get("map")
  public async map(
    @Query("region") region?: string,
  ): Promise<ShelterMarkerResponse[]> {
    const shelters = await this.shelterQueryPort.findMappable(region);
    return shelters.map((shelter) => ShelterMarkerResponse.from(shelter));
  }

  @ApiOperation({ summary: "보호소 스태프 로스터 (담당자) — 멤버·역할" })
  @ApiEnvelopeArray(StaffMemberResponse)
  @Get(":shelterId/staff")
  public async listStaff(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
  ): Promise<StaffMemberResponse[]> {
    const members = await this.getShelterStaffUseCase.invoke({
      shelterId,
      actorId: user.userId,
    });
    const sid = ShelterId.fromString(shelterId);
    return members.map((member) => StaffMemberResponse.from(member, sid));
  }

  @ApiOperation({
    summary: "보호소 검증 dossier (운영자) — 심사 상세 (제출정보 + 검증신호)",
  })
  @ApiEnvelope(ShelterVerificationResponse)
  @Get(":shelterId/verification")
  public async getVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
  ): Promise<ShelterVerificationResponse> {
    const { shelter, registrant } =
      await this.getShelterVerificationUseCase.invoke({
        shelterId,
        viewerId: user.userId,
      });
    return ShelterVerificationResponse.from(shelter, registrant);
  }

  @ApiOperation({ summary: "보호소 단건 조회 (슬러그)" })
  @ApiEnvelope(ShelterResponse)
  @Public()
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
