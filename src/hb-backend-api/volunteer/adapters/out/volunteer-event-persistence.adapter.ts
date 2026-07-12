import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { VolunteerEventPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-persistence.port";
import { VolunteerEventRepository } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-event.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/volunteer/adapters/out/volunteer-event.mapper";

@Injectable()
export class VolunteerEventPersistenceAdapter implements VolunteerEventPersistencePort {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerEventRepository)
    private readonly repository: VolunteerEventRepository,
  ) {}

  public async create(event: VolunteerEvent): Promise<void> {
    await this.repository.insert(toInsertDoc(event));
  }

  public async save(event: VolunteerEvent): Promise<void> {
    await this.repository.update(
      event.getId.raw,
      event.getVersion,
      toMutablePatch(event),
    );
  }
}
