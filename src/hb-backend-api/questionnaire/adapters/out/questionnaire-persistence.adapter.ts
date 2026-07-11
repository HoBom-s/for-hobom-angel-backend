import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Questionnaire } from "src/hb-backend-api/questionnaire/domain/model/questionnaire";
import { QuestionnairePersistencePort } from "src/hb-backend-api/questionnaire/domain/ports/out/questionnaire-persistence.port";
import { QuestionnaireRepository } from "src/hb-backend-api/questionnaire/domain/repositories/questionnaire.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/questionnaire/adapters/out/questionnaire.mapper";

@Injectable()
export class QuestionnairePersistenceAdapter implements QuestionnairePersistencePort {
  constructor(
    @Inject(DIToken.QuestionnaireModule.QuestionnaireRepository)
    private readonly repository: QuestionnaireRepository,
  ) {}

  public async create(questionnaire: Questionnaire): Promise<void> {
    await this.repository.insert(toInsertDoc(questionnaire));
  }

  public async save(questionnaire: Questionnaire): Promise<void> {
    await this.repository.update(
      questionnaire.getId.raw,
      questionnaire.getVersion,
      toMutablePatch(questionnaire),
    );
  }
}
