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
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerEventPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-persistence.port";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerSignupPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-persistence.port";
import { VolunteerSignupQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-query.port";
import {
  SignUpForVolunteerCommand,
  SignUpForVolunteerResult,
  SignUpForVolunteerUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/sign-up-for-volunteer.use-case";

/**
 * A member signs up for a volunteer event. In one transaction: verify the event
 * is open and not full, block a duplicate signup, reserve a capacity slot (the
 * event's optimistic-lock guard rejects a racing over-subscribe), and record the
 * signup — so the count and the roster stay consistent.
 */
@Injectable()
export class SignUpForVolunteerService implements SignUpForVolunteerUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly eventQueryPort: VolunteerEventQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerEventPersistencePort)
    private readonly eventPersistencePort: VolunteerEventPersistencePort,
    @Inject(DIToken.VolunteerModule.VolunteerSignupQueryPort)
    private readonly signupQueryPort: VolunteerSignupQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerSignupPersistencePort)
    private readonly signupPersistencePort: VolunteerSignupPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(
    command: SignUpForVolunteerCommand,
  ): Promise<SignUpForVolunteerResult> {
    const eventId = VolunteerEventId.fromString(command.eventId);
    const event = await this.eventQueryPort.findById(eventId);
    if (!event) {
      throw new NotFoundException("봉사 일정을 찾을 수 없어요.");
    }
    if (!event.acceptsSignups(new Date())) {
      throw new ConflictException("지금은 봉사 지원을 받을 수 없어요.");
    }

    const volunteer = await this.userQueryPort.findById(
      UserId.fromString(command.volunteerId),
    );
    if (!volunteer || !volunteer.isActive()) {
      throw new ForbiddenException("활성 회원만 봉사에 지원할 수 있어요.");
    }

    const existing = await this.signupQueryPort.findActive(
      eventId,
      volunteer.getId,
    );
    if (existing) {
      throw new ConflictException("이미 지원한 봉사예요.");
    }

    event.reserveSlot(new Date());
    await this.eventPersistencePort.save(event);

    const signup = VolunteerSignup.submit({
      eventId,
      volunteerId: volunteer.getId,
    });
    await this.signupPersistencePort.create(signup);

    return { signupId: signup.getId.toString() };
  }
}
