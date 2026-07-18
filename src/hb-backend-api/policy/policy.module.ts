import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { PolicyDocumentEntity } from "src/hb-backend-api/policy/domain/model/policy-document.entity";
import { PolicyDocumentSchema } from "src/hb-backend-api/policy/domain/model/policy-document.schema";
import { PolicyRepositoryImpl } from "src/hb-backend-api/policy/infra/repositories/policy.repository.impl";
import { PolicyPersistenceAdapter } from "src/hb-backend-api/policy/adapters/out/policy-persistence.adapter";
import { PolicyQueryAdapter } from "src/hb-backend-api/policy/adapters/out/policy-query.adapter";
import { PublishPolicyService } from "src/hb-backend-api/policy/application/use-cases/publish-policy.service";
import { GetCurrentPolicyService } from "src/hb-backend-api/policy/application/use-cases/get-current-policy.service";
import { ListPolicyVersionsService } from "src/hb-backend-api/policy/application/use-cases/list-policy-versions.service";
import { PolicyController } from "src/hb-backend-api/policy/adapters/in/policy.controller";
import { AdminPolicyController } from "src/hb-backend-api/policy/adapters/in/admin-policy.controller";

/**
 * Legal/policy document CMS — versioned privacy policy, terms of service, and
 * operating policy. Public read of the version in effect; operator publish +
 * version history. Versions are immutable so consent can later bind to the exact
 * text a user agreed to.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PolicyDocumentEntity.name, schema: PolicyDocumentSchema },
    ]),
    UserModule,
  ],
  controllers: [PolicyController, AdminPolicyController],
  providers: [
    {
      provide: DIToken.PolicyModule.PublishPolicyUseCase,
      useClass: PublishPolicyService,
    },
    {
      provide: DIToken.PolicyModule.GetCurrentPolicyUseCase,
      useClass: GetCurrentPolicyService,
    },
    {
      provide: DIToken.PolicyModule.ListPolicyVersionsUseCase,
      useClass: ListPolicyVersionsService,
    },
    {
      provide: DIToken.PolicyModule.PolicyRepository,
      useClass: PolicyRepositoryImpl,
    },
    {
      provide: DIToken.PolicyModule.PolicyPersistencePort,
      useClass: PolicyPersistenceAdapter,
    },
    {
      provide: DIToken.PolicyModule.PolicyQueryPort,
      useClass: PolicyQueryAdapter,
    },
  ],
})
export class PolicyModule {}
