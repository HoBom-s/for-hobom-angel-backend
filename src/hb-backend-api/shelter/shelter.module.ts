import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalModule } from "src/hb-backend-api/approval/approval.module";
import { ApprovalCallbackRegistry } from "src/hb-backend-api/approval/application/approval-callback.registry";
import { OutboxModule } from "src/hb-backend-api/outbox/outbox.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { ShelterSchema } from "src/hb-backend-api/shelter/domain/model/shelter.schema";
import { BusinessRegistryAdapter } from "src/hb-backend-api/shelter/adapters/out/business-registry.adapter";
import { PublicShelterDataAdapter } from "src/hb-backend-api/shelter/adapters/out/public-shelter-data.adapter";
import { ShelterPersistenceAdapter } from "src/hb-backend-api/shelter/adapters/out/shelter-persistence.adapter";
import { ShelterQueryAdapter } from "src/hb-backend-api/shelter/adapters/out/shelter-query.adapter";
import { ShelterRepositoryImpl } from "src/hb-backend-api/shelter/infra/repositories/shelter.repository.impl";
import { RegisterShelterService } from "src/hb-backend-api/shelter/application/use-cases/register-shelter.service";
import { ShelterVerificationCallback } from "src/hb-backend-api/shelter/application/shelter-verification.callback";

/**
 * Shelter store and the approval engine's first consumer. Registering a shelter
 * opens a SHELTER_VERIFICATION request; {@link ShelterVerificationCallback}
 * completes it (verify + grant admin + notify) inside the decision transaction.
 * The callback is registered into the engine's {@link ApprovalCallbackRegistry}
 * on init, keeping the engine ignorant of the shelter domain.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShelterEntity.name, schema: ShelterSchema },
    ]),
    ApprovalModule,
    UserModule,
    OutboxModule,
  ],
  providers: [
    {
      provide: DIToken.ShelterModule.RegisterShelterUseCase,
      useClass: RegisterShelterService,
    },
    {
      provide: DIToken.ShelterModule.ShelterRepository,
      useClass: ShelterRepositoryImpl,
    },
    {
      provide: DIToken.ShelterModule.ShelterPersistencePort,
      useClass: ShelterPersistenceAdapter,
    },
    {
      provide: DIToken.ShelterModule.ShelterQueryPort,
      useClass: ShelterQueryAdapter,
    },
    {
      provide: DIToken.ShelterModule.PublicShelterDataPort,
      useClass: PublicShelterDataAdapter,
    },
    {
      provide: DIToken.ShelterModule.BusinessRegistryPort,
      useClass: BusinessRegistryAdapter,
    },
    ShelterVerificationCallback,
  ],
  exports: [
    DIToken.ShelterModule.RegisterShelterUseCase,
    DIToken.ShelterModule.ShelterQueryPort,
  ],
})
export class ShelterModule implements OnModuleInit {
  constructor(
    private readonly callbackRegistry: ApprovalCallbackRegistry,
    private readonly shelterVerificationCallback: ShelterVerificationCallback,
  ) {}

  public onModuleInit(): void {
    this.callbackRegistry.register(this.shelterVerificationCallback);
  }
}
