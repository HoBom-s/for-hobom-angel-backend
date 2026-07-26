import { Module } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionModule } from "src/hb-backend-api/adoption/adoption.module";
import { AnimalModule } from "src/hb-backend-api/animal/animal.module";
import { FosterModule } from "src/hb-backend-api/foster/foster.module";
import { ShelterModule } from "src/hb-backend-api/shelter/shelter.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { ShelterDashboardController } from "src/hb-backend-api/shelter-stats/adapters/in/shelter-dashboard.controller";
import { AdminStatsController } from "src/hb-backend-api/shelter-stats/adapters/in/admin-stats.controller";
import { GetShelterDashboardService } from "src/hb-backend-api/shelter-stats/application/use-cases/get-shelter-dashboard.service";
import { GetAdminStatsService } from "src/hb-backend-api/shelter-stats/application/use-cases/get-admin-stats.service";

/**
 * §07 reporting module. The one place allowed to read across Shelter, User,
 * Animal, Adoption, and Foster — those own their data and cannot depend on this
 * module, so hosting the cross-aggregate composition here keeps the graph
 * acyclic. Serves the per-shelter dashboard (§04/§07) and the operator-wide
 * platform KPIs (§07.7 admin).
 */
@Module({
  imports: [
    AnimalModule,
    AdoptionModule,
    FosterModule,
    ShelterModule,
    UserModule,
  ],
  controllers: [ShelterDashboardController, AdminStatsController],
  providers: [
    {
      provide: DIToken.ShelterStatsModule.GetShelterDashboardUseCase,
      useClass: GetShelterDashboardService,
    },
    {
      provide: DIToken.ShelterStatsModule.GetAdminStatsUseCase,
      useClass: GetAdminStatsService,
    },
  ],
})
export class ShelterStatsModule {}
