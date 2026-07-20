import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import {
  ListShelterFosterApplicationsQuery,
  ListShelterFosterApplicationsUseCase,
} from "src/hb-backend-api/foster/domain/ports/in/list-shelter-foster-applications.use-case";

/**
 * Lists a shelter's foster applications for its staff to process. Only members
 * who can manage the shelter may read it — an application carries an applicant's
 * personal answers.
 */
@Injectable()
export class ListShelterFosterApplicationsService implements ListShelterFosterApplicationsUseCase {
  constructor(
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly queryPort: FosterApplicationQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    query: ListShelterFosterApplicationsQuery,
  ): Promise<Page<FosterApplication>> {
    const shelterId = ShelterId.fromString(query.shelterId);
    const actor = await this.userQueryPort.findById(
      UserId.fromString(query.actorId),
    );
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 담당자만 신청 목록을 볼 수 있어요.");
    }
    return this.queryPort.findPageByShelter(
      shelterId,
      query.status ?? null,
      query.cursor ?? null,
      query.limit,
    );
  }
}
