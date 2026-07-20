import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import {
  GetFosterApplicationQuery,
  GetFosterApplicationUseCase,
} from "src/hb-backend-api/foster/domain/ports/in/get-foster-application.use-case";

/**
 * Reads one foster application with its answers. Visible to the applicant who
 * submitted it or to staff of the owning shelter — nobody else, since it holds
 * personal answers.
 */
@Injectable()
export class GetFosterApplicationService implements GetFosterApplicationUseCase {
  constructor(
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly queryPort: FosterApplicationQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    query: GetFosterApplicationQuery,
  ): Promise<FosterApplication> {
    const application = await this.queryPort.findById(
      FosterApplicationId.fromString(query.applicationId),
    );
    if (!application) {
      throw new NotFoundException("임시보호 신청을 찾을 수 없어요.");
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
