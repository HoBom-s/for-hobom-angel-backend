import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalCallback } from "src/hb-backend-api/approval/domain/ports/out/approval-callback";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { OutboxPayloadFactoryRegistry } from "src/hb-backend-api/outbox/domain/model/outbox-payload-factory.registry";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";
import { AdoptionApplicationPersistencePort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-persistence.port";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Completes an ADOPTION decision. On approval it approves the application and
 * moves the animal to ADOPTED, then emits the notification event; on rejection
 * it rejects the application and RELEASES the animal back to AVAILABLE. Both run
 * inside the operator's decision transaction, so the application, the animal
 * status, and the event commit atomically.
 */
@Injectable()
export class AdoptionApprovalCallback implements ApprovalCallback {
  public readonly type = ApprovalType.ADOPTION;

  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly applicationQueryPort: AdoptionApplicationQueryPort,
    @Inject(DIToken.AdoptionModule.AdoptionApplicationPersistencePort)
    private readonly applicationPersistencePort: AdoptionApplicationPersistencePort,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.OutboxModule.OutboxPersistencePort)
    private readonly outboxPersistencePort: OutboxPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async authorize(
    request: ApprovalRequest,
    actorId: string,
  ): Promise<void> {
    const application = await this.loadApplication(request);
    const actor = await this.userQueryPort.findById(UserId.fromString(actorId));
    if (!actor || !actor.canManageShelter(application.getShelterId)) {
      throw new ForbiddenException(
        "해당 보호소의 스태프만 입양 신청을 결정할 수 있어요.",
      );
    }
  }

  public async onApproved(request: ApprovalRequest): Promise<void> {
    const application = await this.loadApplication(request);
    const animal = await this.loadAnimal(request);

    application.approve();
    await this.applicationPersistencePort.save(application);

    animal.markAdopted();
    await this.animalPersistencePort.save(animal);

    const now = new Date();
    await this.outboxPersistencePort.save(
      CreateOutboxEntity.of(
        EventType.ADOPTION_APPROVED,
        OutboxPayloadFactoryRegistry[EventType.ADOPTION_APPROVED]({
          subjectRef: application.getId.toString(),
          recipientUserId: application.getApplicantId.toString(),
          shelterId: application.getShelterId.toString(),
          occurredAt: now.toISOString(),
        }),
      ),
    );
  }

  public async onRejected(request: ApprovalRequest): Promise<void> {
    const application = await this.loadApplication(request);
    const animal = await this.loadAnimal(request);

    application.reject(request.getReason ?? "심사에서 반려되었어요.");
    await this.applicationPersistencePort.save(application);

    animal.release();
    await this.animalPersistencePort.save(animal);
  }

  private async loadApplication(
    request: ApprovalRequest,
  ): Promise<AdoptionApplication> {
    const application = await this.applicationQueryPort.findById(
      ApplicationId.fromString(request.getSubjectRef),
    );
    if (!application) {
      throw new Error("입양 신청을 찾을 수 없어요.");
    }
    return application;
  }

  private async loadAnimal(request: ApprovalRequest) {
    const animalId = request.getContext?.animalId;
    if (typeof animalId !== "string") {
      throw new Error("입양 승인 요청에 animalId가 없어요.");
    }
    const animal = await this.animalQueryPort.findById(
      AnimalId.fromString(animalId),
    );
    if (!animal) {
      throw new Error("입양 대상 동물을 찾을 수 없어요.");
    }
    return animal;
  }
}
