import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalModule } from "src/hb-backend-api/approval/approval.module";
import { ApprovalCallbackRegistry } from "src/hb-backend-api/approval/application/approval-callback.registry";
import { OutboxModule } from "src/hb-backend-api/outbox/outbox.module";
import { NotificationModule } from "src/hb-backend-api/notification/notification.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { ShelterSchema } from "src/hb-backend-api/shelter/domain/model/shelter.schema";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";
import { VolunteerSignupSchema } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.schema";
import { BusinessRegistryAdapter } from "src/hb-backend-api/shelter/adapters/out/business-registry.adapter";
import { VolunteerActivityAdapter } from "src/hb-backend-api/shelter/adapters/out/volunteer-activity.adapter";
import { PublicShelterDataAdapter } from "src/hb-backend-api/shelter/adapters/out/public-shelter-data.adapter";
import { ShelterPersistenceAdapter } from "src/hb-backend-api/shelter/adapters/out/shelter-persistence.adapter";
import { ShelterQueryAdapter } from "src/hb-backend-api/shelter/adapters/out/shelter-query.adapter";
import { ShelterRepositoryImpl } from "src/hb-backend-api/shelter/infra/repositories/shelter.repository.impl";
import { RegisterShelterService } from "src/hb-backend-api/shelter/application/use-cases/register-shelter.service";
import { RequestStaffPromotionService } from "src/hb-backend-api/shelter/application/use-cases/request-staff-promotion.service";
import { ListSheltersService } from "src/hb-backend-api/shelter/application/use-cases/list-shelters.service";
import { EditShelterProfileService } from "src/hb-backend-api/shelter/application/use-cases/edit-shelter-profile.service";
import { GetShelterStaffService } from "src/hb-backend-api/shelter/application/use-cases/get-shelter-staff.service";
import { GetShelterVerificationService } from "src/hb-backend-api/shelter/application/use-cases/get-shelter-verification.service";
import { GetShelterProfileService } from "src/hb-backend-api/shelter/application/use-cases/get-shelter-profile.service";
import { ListStaffPromotionsService } from "src/hb-backend-api/shelter/application/use-cases/list-staff-promotions.service";
import { RemoveShelterStaffService } from "src/hb-backend-api/shelter/application/use-cases/remove-shelter-staff.service";
import { ShelterVerificationCallback } from "src/hb-backend-api/shelter/application/shelter-verification.callback";
import { StaffPromotionCallback } from "src/hb-backend-api/shelter/application/staff-promotion.callback";
import { ShelterController } from "src/hb-backend-api/shelter/adapters/in/shelter.controller";

/**
 * Shelter store and the approval engine's first consumers. Registering a shelter
 * opens a SHELTER_VERIFICATION request; promoting a member opens a
 * STAFF_PROMOTION request. Each has a callback that completes the decision
 * (verify + grant, or grant staff) inside the decision transaction. Both
 * callbacks are registered into the engine's {@link ApprovalCallbackRegistry} on
 * init, keeping the engine ignorant of the shelter domain.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShelterEntity.name, schema: ShelterSchema },
      // Read-only view of another domain's collection to enrich the promotion
      // queue with candidate volunteer activity. VolunteerModule imports
      // ShelterModule, so we register the model here instead of importing it.
      { name: VolunteerSignupEntity.name, schema: VolunteerSignupSchema },
    ]),
    ApprovalModule,
    UserModule,
    OutboxModule,
    NotificationModule,
  ],
  controllers: [ShelterController],
  providers: [
    {
      provide: DIToken.ShelterModule.RegisterShelterUseCase,
      useClass: RegisterShelterService,
    },
    {
      provide: DIToken.ShelterModule.RequestStaffPromotionUseCase,
      useClass: RequestStaffPromotionService,
    },
    {
      provide: DIToken.ShelterModule.ListSheltersUseCase,
      useClass: ListSheltersService,
    },
    {
      provide: DIToken.ShelterModule.EditShelterProfileUseCase,
      useClass: EditShelterProfileService,
    },
    {
      provide: DIToken.ShelterModule.GetShelterStaffUseCase,
      useClass: GetShelterStaffService,
    },
    {
      provide: DIToken.ShelterModule.GetShelterVerificationUseCase,
      useClass: GetShelterVerificationService,
    },
    {
      provide: DIToken.ShelterModule.GetShelterProfileUseCase,
      useClass: GetShelterProfileService,
    },
    {
      provide: DIToken.ShelterModule.ListStaffPromotionsUseCase,
      useClass: ListStaffPromotionsService,
    },
    {
      provide: DIToken.ShelterModule.RemoveShelterStaffUseCase,
      useClass: RemoveShelterStaffService,
    },
    {
      provide: DIToken.ShelterModule.VolunteerActivityPort,
      useClass: VolunteerActivityAdapter,
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
    StaffPromotionCallback,
  ],
  exports: [
    DIToken.ShelterModule.RegisterShelterUseCase,
    DIToken.ShelterModule.RequestStaffPromotionUseCase,
    DIToken.ShelterModule.ShelterQueryPort,
  ],
})
export class ShelterModule implements OnModuleInit {
  constructor(
    private readonly callbackRegistry: ApprovalCallbackRegistry,
    private readonly shelterVerificationCallback: ShelterVerificationCallback,
    private readonly staffPromotionCallback: StaffPromotionCallback,
  ) {}

  public onModuleInit(): void {
    this.callbackRegistry.register(this.shelterVerificationCallback);
    this.callbackRegistry.register(this.staffPromotionCallback);
  }
}
