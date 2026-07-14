import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { ApiEnvelope } from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";
import { DefineQuestionnaireUseCase } from "src/hb-backend-api/questionnaire/domain/ports/in/define-questionnaire.use-case";
import { QuestionnaireQueryPort } from "src/hb-backend-api/questionnaire/domain/ports/out/questionnaire-query.port";
import { DefineQuestionnaireDto } from "src/hb-backend-api/questionnaire/adapters/in/dto/define-questionnaire.dto";
import { QuestionnaireResponse } from "src/hb-backend-api/questionnaire/adapters/in/dto/questionnaire.response";

@ApiTags("Questionnaires")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/shelters/:shelterId/questionnaires`)
export class QuestionnaireController {
  constructor(
    @Inject(DIToken.QuestionnaireModule.DefineQuestionnaireUseCase)
    private readonly defineQuestionnaireUseCase: DefineQuestionnaireUseCase,
    @Inject(DIToken.QuestionnaireModule.QuestionnaireQueryPort)
    private readonly questionnaireQueryPort: QuestionnaireQueryPort,
  ) {}

  @ApiOperation({ summary: "설문 정의/수정 (보호소 관리자)" })
  @ApiParam({ name: "purpose", enum: QuestionnairePurpose })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(":purpose")
  public async define(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Param("purpose", new ParseEnumPipe(QuestionnairePurpose))
    purpose: QuestionnairePurpose,
    @Body() body: DefineQuestionnaireDto,
  ): Promise<void> {
    await this.defineQuestionnaireUseCase.invoke({
      shelterId,
      purpose,
      definedBy: user.userId,
      questions: body.questions,
    });
  }

  @ApiOperation({ summary: "설문 조회" })
  @ApiParam({ name: "purpose", enum: QuestionnairePurpose })
  @ApiEnvelope(QuestionnaireResponse)
  @Get(":purpose")
  public async get(
    @Param("shelterId") shelterId: string,
    @Param("purpose", new ParseEnumPipe(QuestionnairePurpose))
    purpose: QuestionnairePurpose,
  ): Promise<QuestionnaireResponse> {
    const questionnaire =
      await this.questionnaireQueryPort.findByShelterAndPurpose(
        ShelterId.fromString(shelterId),
        purpose,
      );
    if (!questionnaire) {
      throw new NotFoundException("설문을 찾을 수 없어요.");
    }
    return QuestionnaireResponse.from(questionnaire);
  }
}
