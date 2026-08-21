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
import { PlacementType } from "src/hb-backend-api/animal/domain/enums/placement-type.enum";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";
import { Answer } from "src/hb-backend-api/questionnaire/domain/model/answer";
import { QuestionnaireQueryPort } from "src/hb-backend-api/questionnaire/domain/ports/out/questionnaire-query.port";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationPersistencePort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-persistence.port";
import {
  SubmitFosterApplicationCommand,
  SubmitFosterApplicationResult,
  SubmitFosterApplicationUseCase,
} from "src/hb-backend-api/foster/domain/ports/in/submit-foster-application.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { NotificationType } from "src/hb-backend-api/notification/domain/enums/notification-type.enum";
import { NotifyUseCase } from "src/hb-backend-api/notification/domain/ports/in/notify.use-case";

/**
 * A member applies to foster an animal. In one transaction: verify the animal is
 * open, validate answers against the shelter's foster survey, reserve the animal,
 * record the application (with an answer snapshot and the care period), and open
 * the FOSTER approval — so the reservation and the approval commit together.
 */
@Injectable()
export class SubmitFosterApplicationService implements SubmitFosterApplicationUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.QuestionnaireModule.QuestionnaireQueryPort)
    private readonly questionnaireQueryPort: QuestionnaireQueryPort,
    @Inject(DIToken.FosterModule.FosterApplicationPersistencePort)
    private readonly applicationPersistencePort: FosterApplicationPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.ApprovalModule.SubmitApprovalUseCase)
    private readonly submitApprovalUseCase: SubmitApprovalUseCase,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.NotificationModule.NotifyUseCase)
    private readonly notifyUseCase: NotifyUseCase,
  ) {}

  @Transactional()
  public async invoke(
    command: SubmitFosterApplicationCommand,
  ): Promise<SubmitFosterApplicationResult> {
    const animal = await this.animalQueryPort.findById(
      AnimalId.fromString(command.animalId),
    );
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }
    if (!animal.acceptsApplications()) {
      throw new ConflictException("지금은 임시보호 신청을 받을 수 없어요.");
    }
    if (!animal.isEligibleFor(PlacementType.FOSTER)) {
      throw new ConflictException("이 동물은 임시보호 신청 대상이 아니에요.");
    }

    const applicant = await this.userQueryPort.findById(
      UserId.fromString(command.applicantId),
    );
    if (!applicant || !applicant.isActive()) {
      throw new ForbiddenException("활성 회원만 임시보호를 신청할 수 있어요.");
    }

    const shelterId = animal.getShelterId;
    const answers = (command.answers ?? []).map((a) => Answer.of(a));

    const questionnaire =
      await this.questionnaireQueryPort.findByShelterAndPurpose(
        shelterId,
        QuestionnairePurpose.FOSTER,
      );
    if (questionnaire) {
      questionnaire.validateAnswers(answers);
    }

    animal.reserve();
    await this.animalPersistencePort.save(animal);

    const application = FosterApplication.submit({
      animalId: animal.getId,
      shelterId,
      applicantId: applicant.getId,
      questionnaireVersion: questionnaire?.getVersion ?? 0,
      answers,
      plannedEndDate: command.plannedEndDate ?? null,
    });
    await this.applicationPersistencePort.create(application);

    const approvalId = await this.submitApprovalUseCase.invoke({
      type: ApprovalType.FOSTER,
      subjectRef: application.getId.toString(),
      requesterId: command.applicantId,
      context: { animalId: animal.getId.toString() },
    });

    await this.notifyShelter(shelterId, application, animal.getId.toString());

    return {
      fosterApplicationId: application.getId.toString(),
      approvalId: approvalId.toString(),
    };
  }

  /** Alerts the shelter's representatives that a new application arrived. */
  private async notifyShelter(
    shelterId: ShelterId,
    application: FosterApplication,
    animalId: string,
  ): Promise<void> {
    const shelter = await this.shelterQueryPort.findById(shelterId);
    for (const representativeId of shelter?.getRepresentatives ?? []) {
      await this.notifyUseCase.notify({
        recipientId: representativeId.toString(),
        type: NotificationType.NEW_FOSTER_APPLICATION,
        subjectRef: application.getId.toString(),
        context: {
          shelterId: shelterId.toString(),
          animalId,
          applicantId: application.getApplicantId.toString(),
        },
      });
    }
  }
}
