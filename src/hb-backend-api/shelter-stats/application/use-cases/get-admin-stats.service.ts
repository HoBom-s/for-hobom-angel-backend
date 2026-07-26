import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  AdminStats,
  GetAdminStatsUseCase,
} from "src/hb-backend-api/shelter-stats/domain/ports/in/get-admin-stats.use-case";
import { monthlyBuckets } from "src/hb-backend-api/shelter-stats/application/month-buckets";

/**
 * Platform-wide operator KPIs, composed across Shelter, User, Animal, Adoption
 * and Foster. Operator-only. Monthly figures use KST month boundaries; adoptions
 * are APPROVED adoption applications by the month their decision landed.
 */
@Injectable()
export class GetAdminStatsService implements GetAdminStatsUseCase {
  constructor(
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly adoptionQueryPort: AdoptionApplicationQueryPort,
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly fosterQueryPort: FosterApplicationQueryPort,
  ) {}

  public async invoke(actorId: string): Promise<AdminStats> {
    const actor = await this.userQueryPort.findById(UserId.fromString(actorId));
    if (!actor?.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 볼 수 있어요.");
    }

    const [thisMonth] = monthlyBuckets(new Date(), 1);

    const [
      verifiedShelters,
      activeUsers,
      thisMonthSignups,
      totalAdoptions,
      thisMonthAdoptions,
      pendingAdoption,
      pendingFoster,
    ] = await Promise.all([
      this.shelterQueryPort.countByStatus(ShelterStatus.VERIFIED),
      this.userQueryPort.countByStatus(UserStatus.ACTIVE),
      this.userQueryPort.countCreatedBetween(thisMonth.from, thisMonth.to),
      this.animalQueryPort.countByStatuses([AnimalStatus.ADOPTED]),
      this.adoptionQueryPort.countByStatusBetween(
        AdoptionApplicationStatus.APPROVED,
        thisMonth.from,
        thisMonth.to,
      ),
      this.adoptionQueryPort.countByStatus(AdoptionApplicationStatus.PENDING),
      this.fosterQueryPort.countByStatus(FosterApplicationStatus.PENDING),
    ]);

    return {
      verifiedShelters,
      activeUsers,
      thisMonthSignups,
      totalAdoptions,
      thisMonthAdoptions,
      pendingApplications: pendingAdoption + pendingFoster,
    };
  }
}
