import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import {
  ListShelterAdoptionApplicationsQuery,
  ListShelterAdoptionApplicationsUseCase,
} from "src/hb-backend-api/adoption/domain/ports/in/list-shelter-adoption-applications.use-case";

/**
 * Lists a shelter's adoption applications for its staff to process. Only members
 * who can manage the shelter may read it — an application carries an applicant's
 * personal answers.
 */
@Injectable()
export class ListShelterAdoptionApplicationsService implements ListShelterAdoptionApplicationsUseCase {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly queryPort: AdoptionApplicationQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    query: ListShelterAdoptionApplicationsQuery,
  ): Promise<Page<AdoptionApplication>> {
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
