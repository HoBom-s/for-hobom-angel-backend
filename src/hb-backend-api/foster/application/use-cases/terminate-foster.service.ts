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
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { OutboxPayloadFactoryRegistry } from "src/hb-backend-api/outbox/domain/model/outbox-payload-factory.registry";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";
import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";
import { FosterApplicationPersistencePort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-persistence.port";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { TerminateFosterCommand } from "src/hb-backend-api/foster/domain/ports/in/terminate-foster.use-case";
import { TerminateFosterUseCase } from "src/hb-backend-api/foster/domain/ports/in/terminate-foster.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Ends an active foster: returns the animal to AVAILABLE and emits the
 * termination notification — one transaction. Only the owning shelter's
 * staff/admin or the fosterer may end it; the automated 무기한/expiry sweep (a
 * scheduled job) will call this with EXPIRED once wired.
 */
@Injectable()
export class TerminateFosterService implements TerminateFosterUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly applicationQueryPort: FosterApplicationQueryPort,
    @Inject(DIToken.FosterModule.FosterApplicationPersistencePort)
    private readonly applicationPersistencePort: FosterApplicationPersistencePort,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.OutboxModule.OutboxPersistencePort)
    private readonly outboxPersistencePort: OutboxPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: TerminateFosterCommand): Promise<void> {
    const application = await this.applicationQueryPort.findById(
      FosterApplicationId.fromString(command.fosterApplicationId),
    );
    if (!application) {
      throw new NotFoundException("임시보호 신청을 찾을 수 없어요.");
    }
    if (!application.isActiveFoster()) {
      throw new ConflictException("진행 중인 임시보호가 아니에요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.terminatedBy),
    );
    const isFosterer = actor?.getId.equals(application.getApplicantId) ?? false;
    if (
      !actor ||
      (!actor.canManageShelter(application.getShelterId) && !isFosterer)
    ) {
      throw new ForbiddenException(
        "보호소 담당자나 임시보호자만 종료할 수 있어요.",
      );
    }

    const animal = await this.animalQueryPort.findById(application.getAnimalId);
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }

    const now = new Date();
    application.terminate(command.reason, now);
    await this.applicationPersistencePort.save(application);

    animal.endFoster();
    await this.animalPersistencePort.save(animal);

    await this.outboxPersistencePort.save(
      CreateOutboxEntity.of(
        EventType.FOSTER_TERMINATED,
        OutboxPayloadFactoryRegistry[EventType.FOSTER_TERMINATED]({
          fosterProcessId: application.getId.toString(),
          animalId: animal.getId.toString(),
          recipientUserId: application.getApplicantId.toString(),
          reason:
            command.reason === FosterEndReason.EXPIRED
              ? "EXPIRED"
              : "EARLY_TERMINATED",
          occurredAt: now.toISOString(),
        }),
      ),
    );
  }
}
