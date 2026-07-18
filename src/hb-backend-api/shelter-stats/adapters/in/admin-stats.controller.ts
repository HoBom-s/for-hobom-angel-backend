import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelope } from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { GetAdminStatsUseCase } from "src/hb-backend-api/shelter-stats/domain/ports/in/get-admin-stats.use-case";
import { AdminStatsResponse } from "src/hb-backend-api/shelter-stats/adapters/in/dto/admin-stats.response";

/**
 * §07.7 operator dashboard — platform-wide KPIs across all shelters. Operator
 * only (the use-case enforces it). Distinct from the per-shelter
 * /shelters/:id/dashboard.
 */
@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class AdminStatsController {
  constructor(
    @Inject(DIToken.ShelterStatsModule.GetAdminStatsUseCase)
    private readonly getAdminStatsUseCase: GetAdminStatsUseCase,
  ) {}

  @ApiOperation({
    summary: "운영자 통합 통계 (플랫폼 KPI) — 가입·입양 성사·처리 큐",
  })
  @ApiEnvelope(AdminStatsResponse)
  @Get("admin/stats")
  public async stats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdminStatsResponse> {
    const stats = await this.getAdminStatsUseCase.invoke(user.userId);
    return AdminStatsResponse.from(stats);
  }
}
