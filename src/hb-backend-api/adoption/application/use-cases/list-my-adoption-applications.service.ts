import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import {
  ListMyAdoptionApplicationsQuery,
  ListMyAdoptionApplicationsUseCase,
} from "src/hb-backend-api/adoption/domain/ports/in/list-my-adoption-applications.use-case";

/** Lists the caller's own adoption applications — scoped to their id, no extra check. */
@Injectable()
export class ListMyAdoptionApplicationsService implements ListMyAdoptionApplicationsUseCase {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly queryPort: AdoptionApplicationQueryPort,
  ) {}

  public invoke(
    query: ListMyAdoptionApplicationsQuery,
  ): Promise<Page<AdoptionApplication>> {
    return this.queryPort.findPageByApplicant(
      UserId.fromString(query.applicantId),
      query.status ?? null,
      query.cursor ?? null,
      query.limit,
    );
  }
}
