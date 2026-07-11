import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { SubmitApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/submit-approval.use-case";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { Answer } from "src/hb-backend-api/adoption/domain/model/answer";
import { AdoptionApplicationPersistencePort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-persistence.port";
import { AdoptionQuestionnaireQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-questionnaire-query.port";
import {
  SubmitAdoptionApplicationCommand,
  SubmitAdoptionApplicationResult,
  SubmitAdoptionApplicationUseCase,
} from "src/hb-backend-api/adoption/domain/ports/in/submit-adoption-application.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * A member applies to adopt an animal. In one transaction: verify the animal is
 * open, validate the answers against the shelter's survey, reserve the animal so
 * no one else can apply, record the application (with an answer snapshot), and
 * open the ADOPTION approval. The reservation and the approval commit together,
 * so an animal is never held without a pending application behind it.
 */
@Injectable()
export class SubmitAdoptionApplicationService implements SubmitAdoptionApplicationUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.AdoptionModule.AdoptionQuestionnaireQueryPort)
    private readonly questionnaireQueryPort: AdoptionQuestionnaireQueryPort,
    @Inject(DIToken.AdoptionModule.AdoptionApplicationPersistencePort)
    private readonly applicationPersistencePort: AdoptionApplicationPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.ApprovalModule.SubmitApprovalUseCase)
    private readonly submitApprovalUseCase: SubmitApprovalUseCase,
  ) {}

  @Transactional()
  public async invoke(
    command: SubmitAdoptionApplicationCommand,
  ): Promise<SubmitAdoptionApplicationResult> {
    const animal = await this.animalQueryPort.findById(
      AnimalId.fromString(command.animalId),
    );
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }
    if (!animal.acceptsApplications()) {
      throw new ConflictException("지금은 입양 신청을 받을 수 없어요.");
    }

    const applicant = await this.userQueryPort.findById(
      UserId.fromString(command.applicantId),
    );
    if (!applicant || !applicant.isActive()) {
      throw new ForbiddenException("활성 회원만 입양을 신청할 수 있어요.");
    }

    const shelterId = animal.getShelterId;
    const answers = (command.answers ?? []).map((a) => Answer.of(a));

    const questionnaire =
      await this.questionnaireQueryPort.findByShelter(shelterId);
    if (questionnaire) {
      questionnaire.validateAnswers(answers);
    }

    animal.reserve();
    await this.animalPersistencePort.save(animal);

    const application = AdoptionApplication.submit({
      animalId: animal.getId,
      shelterId,
      applicantId: applicant.getId,
      questionnaireVersion: questionnaire?.getVersion ?? 0,
      answers,
    });
    await this.applicationPersistencePort.create(application);

    const approvalId = await this.submitApprovalUseCase.invoke({
      type: ApprovalType.ADOPTION,
      subjectRef: application.getId.toString(),
      requesterId: command.applicantId,
      context: { animalId: animal.getId.toString() },
    });

    return {
      applicationId: application.getId.toString(),
      approvalId: approvalId.toString(),
    };
  }
}
