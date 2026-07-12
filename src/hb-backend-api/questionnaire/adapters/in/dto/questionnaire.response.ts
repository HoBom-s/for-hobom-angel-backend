import { ApiProperty } from "@nestjs/swagger";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";
import { Questionnaire } from "src/hb-backend-api/questionnaire/domain/model/questionnaire";

export class QuestionnaireResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty({ enum: QuestionnairePurpose })
  purpose: QuestionnairePurpose;

  @ApiProperty()
  version: number;

  @ApiProperty({ type: [Object] })
  questions: {
    id: string;
    prompt: string;
    type: string;
    options: string[];
    required: boolean;
  }[];

  public static from(questionnaire: Questionnaire): QuestionnaireResponse {
    const dto = new QuestionnaireResponse();
    dto.id = questionnaire.getId.toString();
    dto.shelterId = questionnaire.getShelterId.toString();
    dto.purpose = questionnaire.getPurpose;
    dto.version = questionnaire.getVersion;
    dto.questions = questionnaire.getQuestions.map((q) => q.toPlain());
    return dto;
  }
}
