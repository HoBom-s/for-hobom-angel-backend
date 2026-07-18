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
import { SubmitAdoptionApplicationDto } from "src/hb-backend-api/adoption/adapters/in/dto/submit-adoption-application.dto";
import { ReturnAdoptionDto } from "src/hb-backend-api/adoption/adapters/in/dto/return-adoption.dto";

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
}
