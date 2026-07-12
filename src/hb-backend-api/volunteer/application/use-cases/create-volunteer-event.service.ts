import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { VolunteerEventPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-persistence.port";
import {
  CreateVolunteerEventCommand,
  CreateVolunteerEventResult,
  CreateVolunteerEventUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/create-volunteer-event.use-case";

/**
 * Opens a volunteer event. A shelter can only run volunteering once VERIFIED, and
 * only its staff/admin may open events — both are checked before creation.
 */
@Injectable()
export class CreateVolunteerEventService implements CreateVolunteerEventUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerModule.VolunteerEventPersistencePort)
    private readonly eventPersistencePort: VolunteerEventPersistencePort,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(
    command: CreateVolunteerEventCommand,
  ): Promise<CreateVolunteerEventResult> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }
    if (!shelter.isVerified()) {
      throw new ForbiddenException("검증된 보호소만 봉사를 열 수 있어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.createdBy),
    );
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 스태프만 봉사를 열 수 있어요.");
    }

    const event = VolunteerEvent.open({
      shelterId,
      title: command.title,
      description: command.description,
      startAt: command.startAt,
      endAt: command.endAt,
      capacity: command.capacity,
    });
    await this.eventPersistencePort.create(event);

    return { eventId: event.getId.toString() };
  }
}
