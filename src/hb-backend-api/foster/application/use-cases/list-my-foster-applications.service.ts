import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import {
  ListMyFosterApplicationsQuery,
  ListMyFosterApplicationsUseCase,
} from "src/hb-backend-api/foster/domain/ports/in/list-my-foster-applications.use-case";

/** Lists the caller's own foster applications — scoped to their id, no extra check. */
@Injectable()
export class ListMyFosterApplicationsService implements ListMyFosterApplicationsUseCase {
  constructor(
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly queryPort: FosterApplicationQueryPort,
  ) {}

  public invoke(
    query: ListMyFosterApplicationsQuery,
  ): Promise<Page<FosterApplication>> {
    return this.queryPort.findPageByApplicant(
      UserId.fromString(query.applicantId),
      query.status ?? null,
      query.cursor ?? null,
      query.limit,
    );
  }
}
