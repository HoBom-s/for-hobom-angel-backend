import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerEventRepository } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-event.repository";
import { toDomain } from "src/hb-backend-api/volunteer/adapters/out/volunteer-event.mapper";

@Injectable()
export class VolunteerEventQueryAdapter implements VolunteerEventQueryPort {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerEventRepository)
    private readonly repository: VolunteerEventRepository,
  ) {}

  public async findById(id: VolunteerEventId): Promise<VolunteerEvent | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByShelter(shelterId: ShelterId): Promise<VolunteerEvent[]> {
    const docs = await this.repository.findByShelterId(shelterId.raw);
    return docs.map(toDomain);
  }

  public async findUpcoming(
    now: Date,
    limit: number,
  ): Promise<VolunteerEvent[]> {
    const docs = await this.repository.findUpcoming(now, limit);
    return docs.map(toDomain);
  }

  public async findExpiredOpen(
    now: Date,
    limit: number,
  ): Promise<VolunteerEvent[]> {
    const docs = await this.repository.findExpiredOpen(now, limit);
    return docs.map(toDomain);
  }
}
