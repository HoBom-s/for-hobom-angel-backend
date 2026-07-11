import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionQuestionnaire } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire";
import { AdoptionQuestionnairePersistencePort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-questionnaire-persistence.port";
import { AdoptionQuestionnaireRepository } from "src/hb-backend-api/adoption/domain/repositories/adoption-questionnaire.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/adoption/adapters/out/adoption-questionnaire.mapper";

@Injectable()
export class AdoptionQuestionnairePersistenceAdapter implements AdoptionQuestionnairePersistencePort {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionQuestionnaireRepository)
    private readonly repository: AdoptionQuestionnaireRepository,
  ) {}

  public async create(questionnaire: AdoptionQuestionnaire): Promise<void> {
    await this.repository.insert(toInsertDoc(questionnaire));
  }

  public async save(questionnaire: AdoptionQuestionnaire): Promise<void> {
    await this.repository.update(
      questionnaire.getId.raw,
      questionnaire.getVersion,
      toMutablePatch(questionnaire),
    );
  }
}
