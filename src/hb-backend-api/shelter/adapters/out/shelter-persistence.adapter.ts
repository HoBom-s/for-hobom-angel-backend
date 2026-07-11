import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterPersistencePort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-persistence.port";
import { ShelterRepository } from "src/hb-backend-api/shelter/domain/repositories/shelter.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/shelter/adapters/out/shelter.mapper";

@Injectable()
export class ShelterPersistenceAdapter implements ShelterPersistencePort {
  constructor(
    @Inject(DIToken.ShelterModule.ShelterRepository)
    private readonly shelterRepository: ShelterRepository,
  ) {}

  public async create(shelter: Shelter): Promise<void> {
    await this.shelterRepository.insert(toInsertDoc(shelter));
  }

  public async save(shelter: Shelter): Promise<void> {
    await this.shelterRepository.update(
      shelter.getId.raw,
      shelter.getVersion,
      toMutablePatch(shelter),
    );
  }
}
