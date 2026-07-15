import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import {
  AnimalQueryPort,
  AnimalSearchCriteria,
} from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
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

  public countByShelterAndStatuses(
    shelterId: ShelterId,
    statuses: AnimalStatus[],
  ): Promise<number> {
    return this.animalRepository.countByShelterAndStatuses(
      shelterId.raw,
      statuses,
    );
  }

  public async search(criteria: AnimalSearchCriteria): Promise<Page<Animal>> {
    const cursorId =
      criteria.cursor && Types.ObjectId.isValid(criteria.cursor)
        ? new Types.ObjectId(criteria.cursor)
        : null;

    const docs = await this.animalRepository.search(
      {
        species: criteria.species,
        size: criteria.size,
        sex: criteria.sex,
        status: criteria.status,
        keyword: criteria.keyword,
      },
      cursorId,
      criteria.limit,
      criteria.sort,
    );

    const hasNext = docs.length > criteria.limit;
    const pageDocs = hasNext ? docs.slice(0, criteria.limit) : docs;
    const items = pageDocs.map(toDomain);
    const last = pageDocs[pageDocs.length - 1];

    return {
      items,
      hasNext,
      nextCursor: hasNext && last ? String(last._id) : null,
    };
  }
}
