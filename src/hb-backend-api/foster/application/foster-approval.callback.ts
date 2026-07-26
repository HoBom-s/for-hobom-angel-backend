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
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";
import { FosterApplicationPersistencePort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-persistence.port";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Completes a FOSTER decision. On approval it approves the application and moves
 * the animal to FOSTERED, then emits the notification; on rejection it rejects
 * the application and RELEASES the animal back to AVAILABLE. Both run inside the
 * operator's decision transaction, so status, animal state and event commit
 * atomically.
 */
@Injectable()
export class FosterApprovalCallback implements ApprovalCallback {
  public readonly type = ApprovalType.FOSTER;

  constructor(
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly applicationQueryPort: FosterApplicationQueryPort,
    @Inject(DIToken.FosterModule.FosterApplicationPersistencePort)
    private readonly applicationPersistencePort: FosterApplicationPersistencePort,
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
        "해당 보호소의 스태프만 임시보호 신청을 결정할 수 있어요.",
      );
    }
  }

  public async onApproved(request: ApprovalRequest): Promise<void> {
    const application = await this.loadApplication(request);
    const animal = await this.loadAnimal(request);

    application.approve();
    await this.applicationPersistencePort.save(application);

    animal.markFostered();
    await this.animalPersistencePort.save(animal);

    const now = new Date();
    await this.outboxPersistencePort.save(
      CreateOutboxEntity.of(
        EventType.FOSTER_APPROVED,
        OutboxPayloadFactoryRegistry[EventType.FOSTER_APPROVED]({
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
  ): Promise<FosterApplication> {
    const application = await this.applicationQueryPort.findById(
      FosterApplicationId.fromString(request.getSubjectRef),
    );
    if (!application) {
      throw new Error("임시보호 신청을 찾을 수 없어요.");
    }
    return application;
  }

  private async loadAnimal(request: ApprovalRequest) {
    const animalId = request.getContext?.animalId;
    if (typeof animalId !== "string") {
      throw new Error("임시보호 승인 요청에 animalId가 없어요.");
    }
    const animal = await this.animalQueryPort.findById(
      AnimalId.fromString(animalId),
    );
    if (!animal) {
      throw new Error("임시보호 대상 동물을 찾을 수 없어요.");
    }
    return animal;
  }
}
