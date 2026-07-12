import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
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
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { RegisterShelterDto } from "src/hb-backend-api/shelter/adapters/in/dto/register-shelter.dto";
import { RequestStaffPromotionDto } from "src/hb-backend-api/shelter/adapters/in/dto/request-staff-promotion.dto";
import { ShelterResponse } from "src/hb-backend-api/shelter/adapters/in/dto/shelter.response";

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
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
  ) {}

  @ApiOperation({
    summary: "보호소 등록 (등록자가 대표가 되고 검증 심사가 열림)",
  })
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

  @ApiOperation({ summary: "보호소 단건 조회 (슬러그)" })
  @ApiResponse({ type: ShelterResponse })
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
