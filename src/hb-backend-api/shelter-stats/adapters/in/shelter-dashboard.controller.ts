import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelope } from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { GetShelterDashboardUseCase } from "src/hb-backend-api/shelter-stats/domain/ports/in/get-shelter-dashboard.use-case";
import { ShelterDashboardResponse } from "src/hb-backend-api/shelter-stats/adapters/in/dto/shelter-dashboard.response";

/**
 * §07 management dashboard for a single shelter — KPIs composed across the
 * Animal, Adoption, and Foster read models. Staff-scoped (the use-case enforces
 * shelter membership). Distinct from the §04 public /shelters/:id/stats.
 */
@ApiTags("Shelters")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class ShelterDashboardController {
  constructor(
    @Inject(DIToken.ShelterStatsModule.GetShelterDashboardUseCase)
    private readonly getShelterDashboardUseCase: GetShelterDashboardUseCase,
  ) {}

  @ApiOperation({
    summary:
      "보호소 통계 대시보드 (§07, 소속 스태프) — 입양율·월별 추이·처리 큐",
  })
  @ApiEnvelope(ShelterDashboardResponse)
  @Get("shelters/:shelterId/dashboard")
  public async dashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
  ): Promise<ShelterDashboardResponse> {
    const dashboard = await this.getShelterDashboardUseCase.invoke(
      shelterId,
      user.userId,
    );
    return ShelterDashboardResponse.from(dashboard);
  }
}
