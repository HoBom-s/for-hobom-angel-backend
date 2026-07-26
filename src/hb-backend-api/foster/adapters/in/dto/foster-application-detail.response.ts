import { ApiProperty } from "@nestjs/swagger";
import { AnswerResponse } from "src/hb-backend-api/questionnaire/adapters/in/dto/answer.response";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";

/** Single-application projection — the summary plus the submitted answers. */
export class FosterApplicationDetailResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  animalId: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  applicantId: string;

  @ApiProperty({ enum: FosterApplicationStatus })
  status: FosterApplicationStatus;

  @ApiProperty()
  questionnaireVersion: number;

  @ApiProperty({ type: [AnswerResponse] })
  answers: AnswerResponse[];

  @ApiProperty({ nullable: true, description: "종료 예정일 (null=무기한)" })
  plannedEndDate: Date | null;

  @ApiProperty({ nullable: true, description: "반려 사유 (REJECTED)" })
  decidedReason: string | null;

  @ApiProperty({ nullable: true, description: "종료 시각" })
  endedAt: Date | null;

  @ApiProperty({
    enum: FosterEndReason,
    nullable: true,
    description: "종료 사유",
  })
  endReason: FosterEndReason | null;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(app: FosterApplication): FosterApplicationDetailResponse {
    const dto = new FosterApplicationDetailResponse();
    dto.id = app.getId.toString();
    dto.animalId = app.getAnimalId.toString();
    dto.shelterId = app.getShelterId.toString();
    dto.applicantId = app.getApplicantId.toString();
    dto.status = app.getStatus;
    dto.questionnaireVersion = app.getQuestionnaireVersion;
    dto.answers = app.getAnswers.map((a) => AnswerResponse.from(a));
    dto.plannedEndDate = app.getPlannedEndDate;
    dto.decidedReason = app.getDecidedReason;
    dto.endedAt = app.getEndedAt;
    dto.endReason = app.getEndReason;
    dto.createdAt = app.getCreatedAt;
    return dto;
  }
}
