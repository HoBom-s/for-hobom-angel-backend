import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import {
  GetAdoptionApplicationQuery,
  GetAdoptionApplicationUseCase,
} from "src/hb-backend-api/adoption/domain/ports/in/get-adoption-application.use-case";

/**
 * Reads one adoption application with its answers. Visible to the applicant who
 * submitted it or to staff of the owning shelter — nobody else, since it holds
 * personal answers.
 */
@Injectable()
export class GetAdoptionApplicationService implements GetAdoptionApplicationUseCase {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly queryPort: AdoptionApplicationQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    query: GetAdoptionApplicationQuery,
  ): Promise<AdoptionApplication> {
    const application = await this.queryPort.findById(
      ApplicationId.fromString(query.applicationId),
    );
    if (!application) {
      throw new NotFoundException("입양 신청을 찾을 수 없어요.");
    }

    const isOwner = application.getApplicantId.toString() === query.actorId;
    if (!isOwner) {
      const actor = await this.userQueryPort.findById(
        UserId.fromString(query.actorId),
      );
      if (!actor || !actor.canManageShelter(application.getShelterId)) {
        throw new ForbiddenException("이 신청을 볼 권한이 없어요.");
      }
    }
    return application;
  }
}
