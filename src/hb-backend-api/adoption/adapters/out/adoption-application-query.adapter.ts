import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { AdoptionApplicationRepository } from "src/hb-backend-api/adoption/domain/repositories/adoption-application.repository";
import { toDomain } from "src/hb-backend-api/adoption/adapters/out/adoption-application.mapper";

@Injectable()
export class AdoptionApplicationQueryAdapter implements AdoptionApplicationQueryPort {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationRepository)
    private readonly repository: AdoptionApplicationRepository,
  ) {}

  public async findById(
    id: ApplicationId,
  ): Promise<AdoptionApplication | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }
}
