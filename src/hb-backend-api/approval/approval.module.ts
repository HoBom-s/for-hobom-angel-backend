import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { ApprovalActionEntity } from "src/hb-backend-api/approval/domain/model/approval-action.entity";
import { ApprovalActionSchema } from "src/hb-backend-api/approval/domain/model/approval-action.schema";
import { ApprovalRequestEntity } from "src/hb-backend-api/approval/domain/model/approval-request.entity";
import { ApprovalRequestSchema } from "src/hb-backend-api/approval/domain/model/approval-request.schema";
import { ApprovalPersistenceAdapter } from "src/hb-backend-api/approval/adapters/out/approval-persistence.adapter";
import { ApprovalQueryAdapter } from "src/hb-backend-api/approval/adapters/out/approval-query.adapter";
import { ApprovalRepositoryImpl } from "src/hb-backend-api/approval/infra/repositories/approval.repository.impl";
import { ApprovalCallbackRegistry } from "src/hb-backend-api/approval/application/approval-callback.registry";
import { SubmitApprovalService } from "src/hb-backend-api/approval/application/use-cases/submit-approval.service";
import { DecideApprovalService } from "src/hb-backend-api/approval/application/use-cases/decide-approval.service";
import { ListPendingApprovalsService } from "src/hb-backend-api/approval/application/use-cases/list-pending-approvals.service";
import { CountPendingApprovalsService } from "src/hb-backend-api/approval/application/use-cases/count-pending-approvals.service";
import { ApprovalController } from "src/hb-backend-api/approval/adapters/in/approval.controller";

/**
 * The one approval engine. Domain modules consume it by submitting requests
 * (SubmitApprovalService) and registering a completion callback per type into
 * {@link ApprovalCallbackRegistry}. Operators decide via DecideApprovalService.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalRequestEntity.name, schema: ApprovalRequestSchema },
      { name: ApprovalActionEntity.name, schema: ApprovalActionSchema },
    ]),
    UserModule,
  ],
  controllers: [ApprovalController],
  providers: [
    ApprovalCallbackRegistry,
    {
      provide: DIToken.ApprovalModule.SubmitApprovalUseCase,
      useClass: SubmitApprovalService,
    },
    {
      provide: DIToken.ApprovalModule.DecideApprovalUseCase,
      useClass: DecideApprovalService,
    },
    {
      provide: DIToken.ApprovalModule.ListPendingApprovalsUseCase,
      useClass: ListPendingApprovalsService,
    },
    {
      provide: DIToken.ApprovalModule.CountPendingApprovalsUseCase,
      useClass: CountPendingApprovalsService,
    },
    {
      provide: DIToken.ApprovalModule.ApprovalRepository,
      useClass: ApprovalRepositoryImpl,
    },
    {
      provide: DIToken.ApprovalModule.ApprovalPersistencePort,
      useClass: ApprovalPersistenceAdapter,
    },
    {
      provide: DIToken.ApprovalModule.ApprovalQueryPort,
      useClass: ApprovalQueryAdapter,
    },
  ],
  exports: [
    ApprovalCallbackRegistry,
    DIToken.ApprovalModule.SubmitApprovalUseCase,
    DIToken.ApprovalModule.DecideApprovalUseCase,
    DIToken.ApprovalModule.ApprovalQueryPort,
  ],
})
export class ApprovalModule {}
