import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";
import { VolunteerSignupQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-query.port";
import { VolunteerSignupRepository } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-signup.repository";
import { toDomain } from "src/hb-backend-api/volunteer/adapters/out/volunteer-signup.mapper";

@Injectable()
export class VolunteerSignupQueryAdapter implements VolunteerSignupQueryPort {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerSignupRepository)
    private readonly repository: VolunteerSignupRepository,
  ) {}

  public async findById(
    id: VolunteerSignupId,
  ): Promise<VolunteerSignup | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findLive(
    eventId: VolunteerEventId,
    volunteerId: UserId,
  ): Promise<VolunteerSignup | null> {
    const doc = await this.repository.findLive(eventId.raw, volunteerId.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByEvent(
    eventId: VolunteerEventId,
  ): Promise<VolunteerSignup[]> {
    const docs = await this.repository.findByEvent(eventId.raw);
    return docs.map(toDomain);
  }
}
