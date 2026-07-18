import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiCreatedEnvelope } from "src/shared/response/api-envelope.decorator";
import { SubmitFosterResponse } from "src/hb-backend-api/foster/adapters/in/dto/submit-foster.response";
import { ConvertFosterResponse } from "src/hb-backend-api/foster/adapters/in/dto/convert-foster.response";
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
import {
  ConvertFosterToAdoptionResult,
  ConvertFosterToAdoptionUseCase,
} from "src/hb-backend-api/foster/domain/ports/in/convert-foster-to-adoption.use-case";
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
    @Inject(DIToken.FosterModule.ConvertFosterToAdoptionUseCase)
    private readonly convertFosterToAdoptionUseCase: ConvertFosterToAdoptionUseCase,
  ) {}

  @ApiOperation({ summary: "임시보호 신청 (동물이 예약되고 심사가 열림)" })
  @ApiCreatedEnvelope(SubmitFosterResponse)
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
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
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

  @ApiOperation({ summary: "임시보호 → 입양 전환 (보호소 담당자)" })
  @ApiCreatedEnvelope(ConvertFosterResponse)
  @Post("foster-applications/:fosterApplicationId/adoption-conversion")
  public convertToAdoption(
    @CurrentUser() user: AuthenticatedUser,
    @Param("fosterApplicationId") fosterApplicationId: string,
  ): Promise<ConvertFosterToAdoptionResult> {
    return this.convertFosterToAdoptionUseCase.invoke({
      fosterApplicationId,
      actorId: user.userId,
    });
  }
}
