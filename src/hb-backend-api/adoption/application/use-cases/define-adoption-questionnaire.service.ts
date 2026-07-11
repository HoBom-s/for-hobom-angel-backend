import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionQuestionnaire } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire";
import { Question } from "src/hb-backend-api/adoption/domain/model/question";
import { DefineAdoptionQuestionnaireCommand } from "src/hb-backend-api/adoption/domain/ports/in/define-adoption-questionnaire.use-case";
import { DefineAdoptionQuestionnaireUseCase } from "src/hb-backend-api/adoption/domain/ports/in/define-adoption-questionnaire.use-case";
import { AdoptionQuestionnairePersistencePort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-questionnaire-persistence.port";
import { AdoptionQuestionnaireQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-questionnaire-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Creates or replaces a shelter's adoption survey. One questionnaire per shelter,
 * so a second call edits the existing one (bumping its version); only that
 * shelter's admin may define it.
 */
@Injectable()
export class DefineAdoptionQuestionnaireService implements DefineAdoptionQuestionnaireUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AdoptionModule.AdoptionQuestionnairePersistencePort)
    private readonly persistencePort: AdoptionQuestionnairePersistencePort,
    @Inject(DIToken.AdoptionModule.AdoptionQuestionnaireQueryPort)
    private readonly queryPort: AdoptionQuestionnaireQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(
    command: DefineAdoptionQuestionnaireCommand,
  ): Promise<void> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.definedBy),
    );
    if (!actor || !actor.hasShelterRole(shelterId, UserRole.SHELTER_ADMIN)) {
      throw new ForbiddenException(
        "보호소 관리자만 입양 설문을 정의할 수 있어요.",
      );
    }

    const questions = command.questions.map((q) => Question.of(q));

    const existing = await this.queryPort.findByShelter(shelterId);
    if (existing) {
      existing.replaceQuestions(questions);
      await this.persistencePort.save(existing);
      return;
    }
    await this.persistencePort.create(
      AdoptionQuestionnaire.define({ shelterId, questions }),
    );
  }
}
