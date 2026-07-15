import { Module } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionModule } from "src/hb-backend-api/adoption/adoption.module";
import { AnimalModule } from "src/hb-backend-api/animal/animal.module";
import { FosterModule } from "src/hb-backend-api/foster/foster.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { ShelterDashboardController } from "src/hb-backend-api/shelter-stats/adapters/in/shelter-dashboard.controller";
import { GetShelterDashboardService } from "src/hb-backend-api/shelter-stats/application/use-cases/get-shelter-dashboard.service";

/**
 * §07 reporting module. The one place allowed to read across Animal, Adoption,
 * and Foster — those own their data and cannot depend on this module, so hosting
 * the cross-aggregate dashboard composition here keeps the module graph acyclic.
 */
@Module({
  imports: [AnimalModule, AdoptionModule, FosterModule, UserModule],
  controllers: [ShelterDashboardController],
  providers: [
    {
      provide: DIToken.ShelterStatsModule.GetShelterDashboardUseCase,
      useClass: GetShelterDashboardService,
    },
  ],
})
export class ShelterStatsModule {}
