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
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";
import { VolunteerEventPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-persistence.port";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerSignupPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-persistence.port";
import { VolunteerSignupQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-query.port";
import {
  WithdrawVolunteerSignupCommand,
  WithdrawVolunteerSignupUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/withdraw-volunteer-signup.use-case";

/**
 * A volunteer withdraws their own signup and the event's slot is freed — one
 * transaction so the roster and the capacity count stay consistent.
 */
@Injectable()
export class WithdrawVolunteerSignupService implements WithdrawVolunteerSignupUseCase {
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
  ) {}

  @Transactional()
  public async invoke(command: WithdrawVolunteerSignupCommand): Promise<void> {
    const signup = await this.signupQueryPort.findById(
      VolunteerSignupId.fromString(command.signupId),
    );
    if (!signup) {
      throw new NotFoundException("봉사 지원을 찾을 수 없어요.");
    }
    if (!signup.isOwnedBy(UserId.fromString(command.volunteerId))) {
      throw new ForbiddenException("본인의 지원만 철회할 수 있어요.");
    }

    signup.withdraw();
    await this.signupPersistencePort.save(signup);

    const event = await this.eventQueryPort.findById(signup.getEventId);
    if (event) {
      event.releaseSlot();
      await this.eventPersistencePort.save(event);
    }
  }
}
