import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelope } from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { JwtAuthGuard } from "src/shared/auth/jwt-auth.guard";
import { GetShelterStatsUseCase } from "src/hb-backend-api/animal/domain/ports/in/get-shelter-stats.use-case";
import { ShelterStatsResponse } from "src/hb-backend-api/animal/adapters/in/dto/shelter-stats.response";

/**
 * Shelter stats derived from animal data. Lives in the Animal module (which owns
 * the animals) to avoid a Shelter→Animal circular import, but is routed under
 * /shelters/:id/stats as the §04 About page expects.
 */
@ApiTags("Shelters")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class ShelterStatsController {
  constructor(
    @Inject(DIToken.AnimalModule.GetShelterStatsUseCase)
    private readonly getShelterStatsUseCase: GetShelterStatsUseCase,
  ) {}

  @ApiOperation({ summary: "보호소 통계 (누적 입양 / 보호중)" })
  @ApiEnvelope(ShelterStatsResponse)
  @Get("shelters/:shelterId/stats")
  public async stats(
    @Param("shelterId") shelterId: string,
  ): Promise<ShelterStatsResponse> {
    const stats = await this.getShelterStatsUseCase.invoke(shelterId);
    return ShelterStatsResponse.from(stats);
  }
}
