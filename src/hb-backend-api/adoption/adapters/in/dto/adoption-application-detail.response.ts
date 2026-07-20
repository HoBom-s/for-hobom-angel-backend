import { ApiProperty } from "@nestjs/swagger";
import { AnswerResponse } from "src/hb-backend-api/questionnaire/adapters/in/dto/answer.response";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";

/** Single-application projection — the summary plus the submitted answers. */
export class AdoptionApplicationDetailResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  animalId: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  applicantId: string;

  @ApiProperty({ enum: AdoptionApplicationStatus })
  status: AdoptionApplicationStatus;

  @ApiProperty()
  questionnaireVersion: number;

  @ApiProperty({ type: [AnswerResponse] })
  answers: AnswerResponse[];

  @ApiProperty({ nullable: true, description: "반려 사유 (REJECTED)" })
  decidedReason: string | null;

  @ApiProperty({ nullable: true, description: "반환 시각 (RETURNED)" })
  returnedAt: Date | null;

  @ApiProperty({ nullable: true, description: "반환 사유 (RETURNED)" })
  returnReason: string | null;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(
    app: AdoptionApplication,
  ): AdoptionApplicationDetailResponse {
    const dto = new AdoptionApplicationDetailResponse();
    dto.id = app.getId.toString();
    dto.animalId = app.getAnimalId.toString();
    dto.shelterId = app.getShelterId.toString();
    dto.applicantId = app.getApplicantId.toString();
    dto.status = app.getStatus;
    dto.questionnaireVersion = app.getQuestionnaireVersion;
    dto.answers = app.getAnswers.map((a) => AnswerResponse.from(a));
    dto.decidedReason = app.getDecidedReason;
    dto.returnedAt = app.getReturnedAt;
    dto.returnReason = app.getReturnReason;
    dto.createdAt = app.getCreatedAt;
    return dto;
  }
}
