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
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";
import {
  DecideVolunteerSignupCommand,
  DecideVolunteerSignupUseCase,
  SignupDecision,
} from "src/hb-backend-api/volunteer/domain/ports/in/decide-volunteer-signup.use-case";
import { VolunteerEventPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-persistence.port";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerSignupPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-persistence.port";
import { VolunteerSignupQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-query.port";

/**
 * A shelter's staff decides a pending applicant. Approving keeps the reserved
 * slot; rejecting frees it — both in one transaction so the roster and the
 * event's capacity count stay consistent. Only staff of the event's own shelter
 * may decide.
 */
@Injectable()
export class DecideVolunteerSignupService implements DecideVolunteerSignupUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerModule.VolunteerSignupQueryPort)
    private readonly signupQueryPort: VolunteerSignupQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerSignupPersistencePort)
    private readonly signupPersistencePort: VolunteerSignupPersistencePort,
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly eventQueryPort: VolunteerEventQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerEventPersistencePort)
    private readonly eventPersistencePort: VolunteerEventPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: DecideVolunteerSignupCommand): Promise<void> {
    const signup = await this.signupQueryPort.findById(
      VolunteerSignupId.fromString(command.signupId),
    );
    if (!signup) {
      throw new NotFoundException("봉사 지원을 찾을 수 없어요.");
    }

    const event = await this.eventQueryPort.findById(signup.getEventId);
    if (!event) {
      throw new NotFoundException("봉사 일정을 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor || !actor.canManageShelter(event.getShelterId)) {
      throw new ForbiddenException(
        "보호소 스태프만 지원자를 심사할 수 있어요.",
      );
    }

    if (command.decision === SignupDecision.APPROVE) {
      signup.approve();
      await this.signupPersistencePort.save(signup);
      return;
    }

    signup.reject();
    await this.signupPersistencePort.save(signup);
    event.releaseSlot();
    await this.eventPersistencePort.save(event);
  }
}
