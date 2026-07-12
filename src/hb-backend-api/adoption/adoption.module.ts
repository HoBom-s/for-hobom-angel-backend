import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AnimalModule } from "src/hb-backend-api/animal/animal.module";
import { ApprovalModule } from "src/hb-backend-api/approval/approval.module";
import { ApprovalCallbackRegistry } from "src/hb-backend-api/approval/application/approval-callback.registry";
import { OutboxModule } from "src/hb-backend-api/outbox/outbox.module";
import { QuestionnaireModule } from "src/hb-backend-api/questionnaire/questionnaire.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import { AdoptionApplicationSchema } from "src/hb-backend-api/adoption/domain/model/adoption-application.schema";
import { AdoptionApplicationPersistenceAdapter } from "src/hb-backend-api/adoption/adapters/out/adoption-application-persistence.adapter";
import { AdoptionApplicationQueryAdapter } from "src/hb-backend-api/adoption/adapters/out/adoption-application-query.adapter";
import { AdoptionApplicationRepositoryImpl } from "src/hb-backend-api/adoption/infra/repositories/adoption-application.repository.impl";
import { SubmitAdoptionApplicationService } from "src/hb-backend-api/adoption/application/use-cases/submit-adoption-application.service";
import { AdoptionApprovalCallback } from "src/hb-backend-api/adoption/application/adoption-approval.callback";
import { AdoptionController } from "src/hb-backend-api/adoption/adapters/in/adoption.controller";

/**
 * Adoption procedure — the approval engine's third consumer. Applying reserves
 * the animal and opens an ADOPTION approval; {@link AdoptionApprovalCallback}
 * completes the decision (adopt or release) inside the decision transaction. The
 * callback self-registers into the engine's registry on init. The pre-application
 * survey lives in the shared {@link QuestionnaireModule}.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AdoptionApplicationEntity.name,
        schema: AdoptionApplicationSchema,
      },
    ]),
    ApprovalModule,
    AnimalModule,
    UserModule,
    OutboxModule,
    QuestionnaireModule,
  ],
  controllers: [AdoptionController],
  providers: [
    {
      provide: DIToken.AdoptionModule.SubmitAdoptionApplicationUseCase,
      useClass: SubmitAdoptionApplicationService,
    },
    {
      provide: DIToken.AdoptionModule.AdoptionApplicationRepository,
      useClass: AdoptionApplicationRepositoryImpl,
    },
    {
      provide: DIToken.AdoptionModule.AdoptionApplicationPersistencePort,
      useClass: AdoptionApplicationPersistenceAdapter,
    },
    {
      provide: DIToken.AdoptionModule.AdoptionApplicationQueryPort,
      useClass: AdoptionApplicationQueryAdapter,
    },
    AdoptionApprovalCallback,
  ],
  exports: [DIToken.AdoptionModule.SubmitAdoptionApplicationUseCase],
})
export class AdoptionModule implements OnModuleInit {
  constructor(
    private readonly callbackRegistry: ApprovalCallbackRegistry,
    private readonly adoptionApprovalCallback: AdoptionApprovalCallback,
  ) {}

  public onModuleInit(): void {
    this.callbackRegistry.register(this.adoptionApprovalCallback);
  }
}
