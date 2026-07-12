import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerEventPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-persistence.port";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import {
  CancelVolunteerEventCommand,
  CancelVolunteerEventUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/cancel-volunteer-event.use-case";

/**
 * Cancels a volunteer event. Only the owning shelter's staff/admin may cancel it;
 * authorization is checked against the event's real owner.
 */
@Injectable()
export class CancelVolunteerEventService implements CancelVolunteerEventUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly eventQueryPort: VolunteerEventQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerEventPersistencePort)
    private readonly eventPersistencePort: VolunteerEventPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: CancelVolunteerEventCommand): Promise<void> {
    const event = await this.eventQueryPort.findById(
      VolunteerEventId.fromString(command.eventId),
    );
    if (!event) {
      throw new NotFoundException("봉사 일정을 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.cancelledBy),
    );
    if (!actor || !actor.canManageShelter(event.getShelterId)) {
      throw new ForbiddenException("보호소 스태프만 봉사를 취소할 수 있어요.");
    }

    event.cancel();
    await this.eventPersistencePort.save(event);
  }
}
