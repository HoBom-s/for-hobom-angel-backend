import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { Questionnaire } from "src/hb-backend-api/questionnaire/domain/model/questionnaire";
import { Question } from "src/hb-backend-api/questionnaire/domain/model/question";
import { DefineQuestionnaireCommand } from "src/hb-backend-api/questionnaire/domain/ports/in/define-questionnaire.use-case";
import { DefineQuestionnaireUseCase } from "src/hb-backend-api/questionnaire/domain/ports/in/define-questionnaire.use-case";
import { QuestionnairePersistencePort } from "src/hb-backend-api/questionnaire/domain/ports/out/questionnaire-persistence.port";
import { QuestionnaireQueryPort } from "src/hb-backend-api/questionnaire/domain/ports/out/questionnaire-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Creates or replaces a shelter's survey for a purpose. One questionnaire per
 * (shelter, purpose), so a second call edits the existing one (bumping its
 * version); only that shelter's admin may define it.
 */
@Injectable()
export class DefineQuestionnaireService implements DefineQuestionnaireUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.QuestionnaireModule.QuestionnairePersistencePort)
    private readonly persistencePort: QuestionnairePersistencePort,
    @Inject(DIToken.QuestionnaireModule.QuestionnaireQueryPort)
    private readonly queryPort: QuestionnaireQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: DefineQuestionnaireCommand): Promise<void> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.definedBy),
    );
    if (!actor || !actor.hasShelterRole(shelterId, UserRole.SHELTER_ADMIN)) {
      throw new ForbiddenException("보호소 관리자만 설문을 정의할 수 있어요.");
    }

    const questions = command.questions.map((q) => Question.of(q));

    const existing = await this.queryPort.findByShelterAndPurpose(
      shelterId,
      command.purpose,
    );
    if (existing) {
      existing.replaceQuestions(questions);
      await this.persistencePort.save(existing);
      return;
    }
    await this.persistencePort.create(
      Questionnaire.define({ shelterId, purpose: command.purpose, questions }),
    );
  }
}
