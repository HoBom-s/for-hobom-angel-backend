import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { AnimalRepository } from "src/hb-backend-api/animal/domain/repositories/animal.repository";
import { toDomain } from "src/hb-backend-api/animal/adapters/out/animal.mapper";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

@Injectable()
export class AnimalQueryAdapter implements AnimalQueryPort {
  constructor(
    @Inject(DIToken.AnimalModule.AnimalRepository)
    private readonly animalRepository: AnimalRepository,
  ) {}

  public async findById(id: AnimalId): Promise<Animal | null> {
    const doc = await this.animalRepository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByShelter(shelterId: ShelterId): Promise<Animal[]> {
    const docs = await this.animalRepository.findByShelterId(shelterId.raw);
    return docs.map(toDomain);
  }
}
