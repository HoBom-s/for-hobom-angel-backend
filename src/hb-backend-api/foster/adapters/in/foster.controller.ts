import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import {
  SubmitFosterApplicationResult,
  SubmitFosterApplicationUseCase,
} from "src/hb-backend-api/foster/domain/ports/in/submit-foster-application.use-case";
import { TerminateFosterUseCase } from "src/hb-backend-api/foster/domain/ports/in/terminate-foster.use-case";
import { SubmitFosterApplicationDto } from "src/hb-backend-api/foster/adapters/in/dto/submit-foster-application.dto";
import { TerminateFosterDto } from "src/hb-backend-api/foster/adapters/in/dto/terminate-foster.dto";

@ApiTags("Foster")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class FosterController {
  constructor(
    @Inject(DIToken.FosterModule.SubmitFosterApplicationUseCase)
    private readonly submitFosterApplicationUseCase: SubmitFosterApplicationUseCase,
    @Inject(DIToken.FosterModule.TerminateFosterUseCase)
    private readonly terminateFosterUseCase: TerminateFosterUseCase,
  ) {}

  @ApiOperation({ summary: "임시보호 신청 (동물이 예약되고 심사가 열림)" })
  @Post("animals/:animalId/foster-applications")
  public submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("animalId") animalId: string,
    @Body() body: SubmitFosterApplicationDto,
  ): Promise<SubmitFosterApplicationResult> {
    return this.submitFosterApplicationUseCase.invoke({
      animalId,
      applicantId: user.userId,
      answers: body.answers,
      plannedEndDate: body.plannedEndDate ?? null,
    });
  }

  @ApiOperation({ summary: "임시보호 종료 (보호소 담당자 또는 임시보호자)" })
  @Post("foster-applications/:fosterApplicationId/termination")
  public async terminate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("fosterApplicationId") fosterApplicationId: string,
    @Body() body: TerminateFosterDto,
  ): Promise<void> {
    await this.terminateFosterUseCase.invoke({
      fosterApplicationId,
      terminatedBy: user.userId,
      reason: body.reason,
    });
  }
}
