import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { AdoptionApplicationPersistencePort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-persistence.port";
import { AdoptionApplicationRepository } from "src/hb-backend-api/adoption/domain/repositories/adoption-application.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/adoption/adapters/out/adoption-application.mapper";

@Injectable()
export class AdoptionApplicationPersistenceAdapter implements AdoptionApplicationPersistencePort {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationRepository)
    private readonly repository: AdoptionApplicationRepository,
  ) {}

  public async create(application: AdoptionApplication): Promise<void> {
    await this.repository.insert(toInsertDoc(application));
  }

  public async save(application: AdoptionApplication): Promise<void> {
    await this.repository.update(
      application.getId.raw,
      application.getVersion,
      toMutablePatch(application),
    );
  }
}
