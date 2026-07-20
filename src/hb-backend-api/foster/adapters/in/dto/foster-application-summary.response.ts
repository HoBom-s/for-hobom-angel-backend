import { ApiProperty } from "@nestjs/swagger";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";

/** List-row projection — no answers, so a shelter's queue stays lightweight. */
export class FosterApplicationSummaryResponse {
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

  @ApiProperty({ nullable: true, description: "종료 예정일 (null=무기한)" })
  plannedEndDate: Date | null;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(app: FosterApplication): FosterApplicationSummaryResponse {
    const dto = new FosterApplicationSummaryResponse();
    dto.id = app.getId.toString();
    dto.animalId = app.getAnimalId.toString();
    dto.shelterId = app.getShelterId.toString();
    dto.applicantId = app.getApplicantId.toString();
    dto.status = app.getStatus;
    dto.questionnaireVersion = app.getQuestionnaireVersion;
    dto.plannedEndDate = app.getPlannedEndDate;
    dto.createdAt = app.getCreatedAt;
    return dto;
  }
}
