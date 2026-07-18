import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureModule } from "src/shared/erasure/erasure.module";
import { AdoptionModule } from "src/hb-backend-api/adoption/adoption.module";
import { AnimalModule } from "src/hb-backend-api/animal/animal.module";
import { ApprovalModule } from "src/hb-backend-api/approval/approval.module";
import { ApprovalCallbackRegistry } from "src/hb-backend-api/approval/application/approval-callback.registry";
import { FosterApplicationDestroyer } from "src/hb-backend-api/foster/adapters/erasure/foster-application.destroyer";
import { MessagingModule } from "src/hb-backend-api/messaging/messaging.module";
import { MessageSubjectResolverRegistry } from "src/hb-backend-api/messaging/application/message-subject-resolver.registry";
import { OutboxModule } from "src/hb-backend-api/outbox/outbox.module";
import { QuestionnaireModule } from "src/hb-backend-api/questionnaire/questionnaire.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";
import { FosterApplicationSchema } from "src/hb-backend-api/foster/domain/model/foster-application.schema";
import { FosterApplicationPersistenceAdapter } from "src/hb-backend-api/foster/adapters/out/foster-application-persistence.adapter";
import { FosterApplicationQueryAdapter } from "src/hb-backend-api/foster/adapters/out/foster-application-query.adapter";
import { FosterApplicationRepositoryImpl } from "src/hb-backend-api/foster/infra/repositories/foster-application.repository.impl";
import { SubmitFosterApplicationService } from "src/hb-backend-api/foster/application/use-cases/submit-foster-application.service";
import { TerminateFosterService } from "src/hb-backend-api/foster/application/use-cases/terminate-foster.service";
import { ConvertFosterToAdoptionService } from "src/hb-backend-api/foster/application/use-cases/convert-foster-to-adoption.service";
import { FosterApprovalCallback } from "src/hb-backend-api/foster/application/foster-approval.callback";
import { FosterMessageSubjectResolver } from "src/hb-backend-api/foster/application/foster-message-subject.resolver";
import { FosterController } from "src/hb-backend-api/foster/adapters/in/foster.controller";

/**
 * Foster procedure — the approval engine's fourth consumer. Applying reserves the
 * animal and opens a FOSTER approval; {@link FosterApprovalCallback} completes the
 * decision (foster or release) inside the decision transaction. An active foster
 * ends via TerminateFoster (early or on expiry), which returns the animal to
 * AVAILABLE and emits FOSTER_TERMINATED. The callback self-registers on init.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FosterApplicationEntity.name, schema: FosterApplicationSchema },
    ]),
    ApprovalModule,
    AnimalModule,
    AdoptionModule,
    UserModule,
    OutboxModule,
    QuestionnaireModule,
    MessagingModule,
    ErasureModule,
  ],
  controllers: [FosterController],
  providers: [
    FosterApplicationDestroyer,
    {
      provide: DIToken.FosterModule.SubmitFosterApplicationUseCase,
      useClass: SubmitFosterApplicationService,
    },
    {
      provide: DIToken.FosterModule.TerminateFosterUseCase,
      useClass: TerminateFosterService,
    },
    {
      provide: DIToken.FosterModule.ConvertFosterToAdoptionUseCase,
      useClass: ConvertFosterToAdoptionService,
    },
    {
      provide: DIToken.FosterModule.FosterApplicationRepository,
      useClass: FosterApplicationRepositoryImpl,
    },
    {
      provide: DIToken.FosterModule.FosterApplicationPersistencePort,
      useClass: FosterApplicationPersistenceAdapter,
    },
    {
      provide: DIToken.FosterModule.FosterApplicationQueryPort,
      useClass: FosterApplicationQueryAdapter,
    },
    FosterApprovalCallback,
    FosterMessageSubjectResolver,
  ],
  exports: [
    DIToken.FosterModule.SubmitFosterApplicationUseCase,
    DIToken.FosterModule.TerminateFosterUseCase,
    DIToken.FosterModule.FosterApplicationQueryPort,
  ],
})
export class FosterModule implements OnModuleInit {
  constructor(
    private readonly callbackRegistry: ApprovalCallbackRegistry,
    private readonly fosterApprovalCallback: FosterApprovalCallback,
    private readonly resolverRegistry: MessageSubjectResolverRegistry,
    private readonly fosterMessageSubjectResolver: FosterMessageSubjectResolver,
    private readonly destroyerRegistry: DestroyerRegistry,
    private readonly fosterApplicationDestroyer: FosterApplicationDestroyer,
  ) {}

  public onModuleInit(): void {
    this.callbackRegistry.register(this.fosterApprovalCallback);
    this.resolverRegistry.register(this.fosterMessageSubjectResolver);
    this.destroyerRegistry.register(this.fosterApplicationDestroyer);
  }
}
