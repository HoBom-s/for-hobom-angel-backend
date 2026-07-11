import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationPersistencePort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-persistence.port";
import { FosterApplicationRepository } from "src/hb-backend-api/foster/domain/repositories/foster-application.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/foster/adapters/out/foster-application.mapper";

@Injectable()
export class FosterApplicationPersistenceAdapter implements FosterApplicationPersistencePort {
  constructor(
    @Inject(DIToken.FosterModule.FosterApplicationRepository)
    private readonly repository: FosterApplicationRepository,
  ) {}

  public async create(application: FosterApplication): Promise<void> {
    await this.repository.insert(toInsertDoc(application));
  }

  public async save(application: FosterApplication): Promise<void> {
    await this.repository.update(
      application.getId.raw,
      application.getVersion,
      toMutablePatch(application),
    );
  }
}
