import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionQuestionnaire } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire";
import { AdoptionQuestionnaireQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-questionnaire-query.port";
import { AdoptionQuestionnaireRepository } from "src/hb-backend-api/adoption/domain/repositories/adoption-questionnaire.repository";
import { toDomain } from "src/hb-backend-api/adoption/adapters/out/adoption-questionnaire.mapper";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

@Injectable()
export class AdoptionQuestionnaireQueryAdapter implements AdoptionQuestionnaireQueryPort {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionQuestionnaireRepository)
    private readonly repository: AdoptionQuestionnaireRepository,
  ) {}

  public async findByShelter(
    shelterId: ShelterId,
  ): Promise<AdoptionQuestionnaire | null> {
    const doc = await this.repository.findByShelterId(shelterId.raw);
    return doc ? toDomain(doc) : null;
  }
}
