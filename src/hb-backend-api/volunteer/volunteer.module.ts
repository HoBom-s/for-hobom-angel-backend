import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ShelterModule } from "src/hb-backend-api/shelter/shelter.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { VolunteerEventEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";
import { VolunteerEventSchema } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.schema";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";
import { VolunteerSignupSchema } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.schema";
import { VolunteerEventPersistenceAdapter } from "src/hb-backend-api/volunteer/adapters/out/volunteer-event-persistence.adapter";
import { VolunteerEventQueryAdapter } from "src/hb-backend-api/volunteer/adapters/out/volunteer-event-query.adapter";
import { VolunteerSignupPersistenceAdapter } from "src/hb-backend-api/volunteer/adapters/out/volunteer-signup-persistence.adapter";
import { VolunteerSignupQueryAdapter } from "src/hb-backend-api/volunteer/adapters/out/volunteer-signup-query.adapter";
import { VolunteerEventRepositoryImpl } from "src/hb-backend-api/volunteer/infra/repositories/volunteer-event.repository.impl";
import { VolunteerSignupRepositoryImpl } from "src/hb-backend-api/volunteer/infra/repositories/volunteer-signup.repository.impl";
import { CreateVolunteerEventService } from "src/hb-backend-api/volunteer/application/use-cases/create-volunteer-event.service";
import { SignUpForVolunteerService } from "src/hb-backend-api/volunteer/application/use-cases/sign-up-for-volunteer.service";
import { WithdrawVolunteerSignupService } from "src/hb-backend-api/volunteer/application/use-cases/withdraw-volunteer-signup.service";
import { CancelVolunteerEventService } from "src/hb-backend-api/volunteer/application/use-cases/cancel-volunteer-event.service";
import { VolunteerController } from "src/hb-backend-api/volunteer/adapters/in/volunteer.controller";

/**
 * Volunteer domain — a shelter's scheduled volunteering with a capacity-capped
 * roster. Creating an event requires a verified shelter and its staff; signing up
 * reserves a slot under optimistic concurrency so the roster never oversubscribes.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VolunteerEventEntity.name, schema: VolunteerEventSchema },
      { name: VolunteerSignupEntity.name, schema: VolunteerSignupSchema },
    ]),
    ShelterModule,
    UserModule,
  ],
  controllers: [VolunteerController],
  providers: [
    {
      provide: DIToken.VolunteerModule.CreateVolunteerEventUseCase,
      useClass: CreateVolunteerEventService,
    },
    {
      provide: DIToken.VolunteerModule.SignUpForVolunteerUseCase,
      useClass: SignUpForVolunteerService,
    },
    {
      provide: DIToken.VolunteerModule.WithdrawVolunteerSignupUseCase,
      useClass: WithdrawVolunteerSignupService,
    },
    {
      provide: DIToken.VolunteerModule.CancelVolunteerEventUseCase,
      useClass: CancelVolunteerEventService,
    },
    {
      provide: DIToken.VolunteerModule.VolunteerEventRepository,
      useClass: VolunteerEventRepositoryImpl,
    },
    {
      provide: DIToken.VolunteerModule.VolunteerEventPersistencePort,
      useClass: VolunteerEventPersistenceAdapter,
    },
    {
      provide: DIToken.VolunteerModule.VolunteerEventQueryPort,
      useClass: VolunteerEventQueryAdapter,
    },
    {
      provide: DIToken.VolunteerModule.VolunteerSignupRepository,
      useClass: VolunteerSignupRepositoryImpl,
    },
    {
      provide: DIToken.VolunteerModule.VolunteerSignupPersistencePort,
      useClass: VolunteerSignupPersistenceAdapter,
    },
    {
      provide: DIToken.VolunteerModule.VolunteerSignupQueryPort,
      useClass: VolunteerSignupQueryAdapter,
    },
  ],
  exports: [
    DIToken.VolunteerModule.CreateVolunteerEventUseCase,
    DIToken.VolunteerModule.SignUpForVolunteerUseCase,
    DIToken.VolunteerModule.WithdrawVolunteerSignupUseCase,
    DIToken.VolunteerModule.CancelVolunteerEventUseCase,
    DIToken.VolunteerModule.VolunteerEventQueryPort,
  ],
})
export class VolunteerModule {}
