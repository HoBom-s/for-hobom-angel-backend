import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
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
import { GetAdopterHistoryUseCase } from "src/hb-backend-api/adopter-history/domain/ports/in/get-adopter-history.use-case";
import { AdopterHistoryResponse } from "src/hb-backend-api/adopter-history/adapters/in/dto/adopter-history.response";

@ApiTags("Adopter history")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class AdopterHistoryController {
  constructor(
    @Inject(DIToken.AdopterHistoryModule.GetAdopterHistoryUseCase)
    private readonly getAdopterHistoryUseCase: GetAdopterHistoryUseCase,
  ) {}

  @ApiOperation({
    summary: "신청자 입양/파양 이력 조회 (보호소 담당자 또는 운영자)",
  })
  @ApiResponse({ type: AdopterHistoryResponse })
  @Get("users/:userId/adoption-history")
  public async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
  ): Promise<AdopterHistoryResponse> {
    const history = await this.getAdopterHistoryUseCase.invoke({
      userId,
      viewerId: user.userId,
    });
    return AdopterHistoryResponse.from(history);
  }
}
