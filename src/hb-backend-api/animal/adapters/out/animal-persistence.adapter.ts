import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalRepository } from "src/hb-backend-api/animal/domain/repositories/animal.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/animal/adapters/out/animal.mapper";

@Injectable()
export class AnimalPersistenceAdapter implements AnimalPersistencePort {
  constructor(
    @Inject(DIToken.AnimalModule.AnimalRepository)
    private readonly animalRepository: AnimalRepository,
  ) {}

  public async create(animal: Animal): Promise<void> {
    await this.animalRepository.insert(toInsertDoc(animal));
  }

  public async save(animal: Animal): Promise<void> {
    await this.animalRepository.update(
      animal.getId.raw,
      animal.getVersion,
      toMutablePatch(animal),
    );
  }
}
