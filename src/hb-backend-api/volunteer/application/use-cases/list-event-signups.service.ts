import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { ListEventSignupsUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/list-event-signups.use-case";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerSignupQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-query.port";

@Injectable()
export class ListEventSignupsService implements ListEventSignupsUseCase {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly eventQueryPort: VolunteerEventQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerSignupQueryPort)
    private readonly signupQueryPort: VolunteerSignupQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    eventId: string,
    actorId: string,
  ): Promise<VolunteerSignup[]> {
    const id = VolunteerEventId.fromString(eventId);
    const event = await this.eventQueryPort.findById(id);
    if (!event) {
      throw new NotFoundException("봉사 일정을 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(UserId.fromString(actorId));
    if (!actor || !actor.canManageShelter(event.getShelterId)) {
      throw new ForbiddenException("보호소 스태프만 지원자를 볼 수 있어요.");
    }

    return this.signupQueryPort.findByEvent(id);
  }
}
