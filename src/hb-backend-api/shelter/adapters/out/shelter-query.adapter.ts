import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { ShelterRepository } from "src/hb-backend-api/shelter/domain/repositories/shelter.repository";
import { toDomain } from "src/hb-backend-api/shelter/adapters/out/shelter.mapper";

@Injectable()
export class ShelterQueryAdapter implements ShelterQueryPort {
  constructor(
    @Inject(DIToken.ShelterModule.ShelterRepository)
    private readonly shelterRepository: ShelterRepository,
  ) {}

  public async findById(id: ShelterId): Promise<Shelter | null> {
    const doc = await this.shelterRepository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findBySlug(slug: ShelterSlug): Promise<Shelter | null> {
    const doc = await this.shelterRepository.findBySlug(slug.raw);
    return doc ? toDomain(doc) : null;
  }
}
