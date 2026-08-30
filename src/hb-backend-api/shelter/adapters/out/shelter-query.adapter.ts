import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { parseCursor, toCursorPage } from "src/shared/pagination/keyset";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
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

  public countByStatus(status: ShelterStatus): Promise<number> {
    return this.shelterRepository.countByStatus(status);
  }

  public async findMappable(region?: string): Promise<Shelter[]> {
    const docs = await this.shelterRepository.findMappable(region);
    // Defensive: the aggregate's own rule is the final arbiter of mappability.
    return docs.map(toDomain).filter((shelter) => shelter.isMappable());
  }

  public async findVerified(params: {
    region?: string;
    keyword?: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<Shelter>> {
    const cursorId = parseCursor(params.cursor);

    const docs = await this.shelterRepository.listVerified(
      params.region,
      params.keyword,
      cursorId,
      params.limit,
    );

    return toCursorPage(docs, params.limit, toDomain);
  }
}
