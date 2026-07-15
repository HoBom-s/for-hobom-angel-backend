import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { GetShelterStatsUseCase } from "src/hb-backend-api/animal/domain/ports/in/get-shelter-stats.use-case";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  GetShelterDashboardUseCase,
  ShelterDashboard,
} from "src/hb-backend-api/shelter-stats/domain/ports/in/get-shelter-dashboard.use-case";
import { monthlyBuckets } from "src/hb-backend-api/shelter-stats/application/month-buckets";

/** How many months of adoption history the dashboard trend shows. */
const TREND_MONTHS = 6;

/**
 * Assembles the §07 shelter dashboard. It is the one place allowed to read
 * across Animal, Adoption, and Foster — those modules cannot depend on it, so
 * hosting the composition here keeps the module graph acyclic. Adoptions are
 * counted from APPROVED applications by the month their decision landed
 * (`updatedAt`); a RETURNED adoption leaves the APPROVED set and drops out, so
 * the trend reflects net standing adoptions.
 */
@Injectable()
export class GetShelterDashboardService implements GetShelterDashboardUseCase {
  constructor(
    @Inject(DIToken.AnimalModule.GetShelterStatsUseCase)
    private readonly getShelterStats: GetShelterStatsUseCase,
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly adoptionQueryPort: AdoptionApplicationQueryPort,
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly fosterQueryPort: FosterApplicationQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    shelterId: string,
    actorId: string,
  ): Promise<ShelterDashboard> {
    const id = ShelterId.fromString(shelterId);

    const actor = await this.userQueryPort.findById(UserId.fromString(actorId));
    if (!actor || !actor.canManageShelter(id)) {
      throw new ForbiddenException("보호소 스태프만 통계를 볼 수 있어요.");
    }

    const buckets = monthlyBuckets(new Date(), TREND_MONTHS);

    const [counts, monthlyAdoptions, pendingAdoption, pendingFoster] =
      await Promise.all([
        this.getShelterStats.invoke(shelterId),
        Promise.all(
          buckets.map((bucket) =>
            this.adoptionQueryPort
              .countByShelterAndStatusBetween(
                id,
                AdoptionApplicationStatus.APPROVED,
                bucket.from,
                bucket.to,
              )
              .then((count) => ({ month: bucket.month, count })),
          ),
        ),
        this.adoptionQueryPort.countByShelterAndStatus(
          id,
          AdoptionApplicationStatus.PENDING,
        ),
        this.fosterQueryPort.countByShelterAndStatus(
          id,
          FosterApplicationStatus.PENDING,
        ),
      ]);

    const denominator = counts.adoptedCount + counts.shelteredCount;
    const adoptionRate =
      denominator === 0
        ? 0
        : Math.round((counts.adoptedCount / denominator) * 1000) / 1000;

    const last = monthlyAdoptions.length - 1;
    return {
      adoptedCount: counts.adoptedCount,
      shelteredCount: counts.shelteredCount,
      availableCount: counts.availableCount,
      adoptionRate,
      thisMonthAdoptions: monthlyAdoptions[last]?.count ?? 0,
      lastMonthAdoptions: monthlyAdoptions[last - 1]?.count ?? 0,
      monthlyAdoptions,
      pendingApplications: pendingAdoption + pendingFoster,
    };
  }
}
