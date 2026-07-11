import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";
import { Questionnaire } from "src/hb-backend-api/questionnaire/domain/model/questionnaire";
import { QuestionnaireQueryPort } from "src/hb-backend-api/questionnaire/domain/ports/out/questionnaire-query.port";
import { QuestionnaireRepository } from "src/hb-backend-api/questionnaire/domain/repositories/questionnaire.repository";
import { toDomain } from "src/hb-backend-api/questionnaire/adapters/out/questionnaire.mapper";

@Injectable()
export class QuestionnaireQueryAdapter implements QuestionnaireQueryPort {
  constructor(
    @Inject(DIToken.QuestionnaireModule.QuestionnaireRepository)
    private readonly repository: QuestionnaireRepository,
  ) {}

  public async findByShelterAndPurpose(
    shelterId: ShelterId,
    purpose: QuestionnairePurpose,
  ): Promise<Questionnaire | null> {
    const doc = await this.repository.findByShelterAndPurpose(
      shelterId.raw,
      purpose,
    );
    return doc ? toDomain(doc) : null;
  }
}
