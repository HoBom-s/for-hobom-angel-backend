import { Module } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionModule } from "src/hb-backend-api/adoption/adoption.module";
import { FosterModule } from "src/hb-backend-api/foster/foster.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { GetAdopterHistoryService } from "src/hb-backend-api/adopter-history/application/use-cases/get-adopter-history.service";
import { AdopterHistoryController } from "src/hb-backend-api/adopter-history/adapters/in/adopter-history.controller";

/**
 * Adopter history — a read-only screening view a shelter sees when evaluating an
 * applicant: completed adoptions, returns (파양), fosters, and sanction status.
 * Pure aggregation over existing adoption/foster/user data (no new storage).
 */
@Module({
  imports: [UserModule, AdoptionModule, FosterModule],
  controllers: [AdopterHistoryController],
  providers: [
    {
      provide: DIToken.AdopterHistoryModule.GetAdopterHistoryUseCase,
      useClass: GetAdopterHistoryService,
    },
  ],
})
export class AdopterHistoryModule {}
