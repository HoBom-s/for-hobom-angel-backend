import { ApiProperty } from "@nestjs/swagger";
import { Answer } from "src/hb-backend-api/questionnaire/domain/model/answer";

/**
 * One submitted answer. The application snapshots only `questionId` + `values`
 * (and the questionnaire version), not the prompt text, so the client resolves
 * prompts against the questionnaire it renders.
 */
export class AnswerResponse {
  @ApiProperty()
  questionId: string;

  @ApiProperty({ type: [String] })
  values: string[];

  public static from(answer: Answer): AnswerResponse {
    const dto = new AnswerResponse();
    dto.questionId = answer.getQuestionId;
    dto.values = answer.getValues;
    return dto;
  }
}
