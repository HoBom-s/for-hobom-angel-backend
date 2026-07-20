import { ApiProperty } from "@nestjs/swagger";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";

/** List-row projection — no answers, so a shelter's queue stays lightweight. */
export class AdoptionApplicationSummaryResponse {
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

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(
    app: AdoptionApplication,
  ): AdoptionApplicationSummaryResponse {
    const dto = new AdoptionApplicationSummaryResponse();
    dto.id = app.getId.toString();
    dto.animalId = app.getAnimalId.toString();
    dto.shelterId = app.getShelterId.toString();
    dto.applicantId = app.getApplicantId.toString();
    dto.status = app.getStatus;
    dto.questionnaireVersion = app.getQuestionnaireVersion;
    dto.createdAt = app.getCreatedAt;
    return dto;
  }
}
