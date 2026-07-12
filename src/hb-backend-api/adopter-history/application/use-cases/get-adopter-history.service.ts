import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { AdopterHistory } from "src/hb-backend-api/adopter-history/domain/model/adopter-history";
import {
  GetAdopterHistoryQuery,
  GetAdopterHistoryUseCase,
} from "src/hb-backend-api/adopter-history/domain/ports/in/get-adopter-history.use-case";

/**
 * Aggregates an applicant's placement record from existing data — completed
 * adoptions, returns (파양), fosters — plus whether the account is sanctioned.
 * Visible only to shelter staff/admins (screening an application) or a platform
 * operator; it exposes another member's history, so it is not public.
 */
@Injectable()
export class GetAdopterHistoryService implements GetAdopterHistoryUseCase {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly adoptionQueryPort: AdoptionApplicationQueryPort,
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly fosterQueryPort: FosterApplicationQueryPort,
  ) {}

  public async invoke(query: GetAdopterHistoryQuery): Promise<AdopterHistory> {
    const viewer = await this.userQueryPort.findById(
      UserId.fromString(query.viewerId),
    );
    const canView =
      viewer?.isPlatformAdmin() ||
      viewer?.hasAnyRole([UserRole.SHELTER_STAFF, UserRole.SHELTER_ADMIN]);
    if (!canView) {
      throw new ForbiddenException(
        "보호소 담당자만 신청자 이력을 볼 수 있어요.",
      );
    }

    const target = await this.userQueryPort.findById(
      UserId.fromString(query.userId),
    );
    if (!target) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }
    const targetId = target.getId;

    const [adoptions, returns, fosters] = await Promise.all([
      this.adoptionQueryPort.countByApplicantAndStatus(
        targetId,
        AdoptionApplicationStatus.APPROVED,
      ),
      this.adoptionQueryPort.countByApplicantAndStatus(
        targetId,
        AdoptionApplicationStatus.RETURNED,
      ),
      this.fosterQueryPort.countByApplicantAndStatus(
        targetId,
        FosterApplicationStatus.APPROVED,
      ),
    ]);

    return {
      userId: targetId.toString(),
      adoptions,
      returns,
      fosters,
      sanctioned: target.isSuspended(),
    };
  }
}
