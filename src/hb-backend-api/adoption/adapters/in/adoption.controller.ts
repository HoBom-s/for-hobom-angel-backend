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
  SubmitAdoptionApplicationResult,
  SubmitAdoptionApplicationUseCase,
} from "src/hb-backend-api/adoption/domain/ports/in/submit-adoption-application.use-case";
import { SubmitAdoptionApplicationDto } from "src/hb-backend-api/adoption/adapters/in/dto/submit-adoption-application.dto";

@ApiTags("Adoption")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/animals/:animalId/adoption-applications`)
export class AdoptionController {
  constructor(
    @Inject(DIToken.AdoptionModule.SubmitAdoptionApplicationUseCase)
    private readonly submitAdoptionApplicationUseCase: SubmitAdoptionApplicationUseCase,
  ) {}

  @ApiOperation({ summary: "입양 신청 (동물이 예약되고 심사가 열림)" })
  @Post()
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
}
