import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AuditModule } from "src/hb-backend-api/audit/audit.module";
import { PolicyModule } from "src/hb-backend-api/policy/policy.module";
import { ConsentEntity } from "src/hb-backend-api/consent/domain/model/consent.entity";
import { ConsentSchema } from "src/hb-backend-api/consent/domain/model/consent.schema";
import { ConsentRepositoryImpl } from "src/hb-backend-api/consent/infra/repositories/consent.repository.impl";
import { ConsentPersistenceAdapter } from "src/hb-backend-api/consent/adapters/out/consent-persistence.adapter";
import { ConsentQueryAdapter } from "src/hb-backend-api/consent/adapters/out/consent-query.adapter";
import { GrantConsentService } from "src/hb-backend-api/consent/application/use-cases/grant-consent.service";
import { WithdrawConsentService } from "src/hb-backend-api/consent/application/use-cases/withdraw-consent.service";
import { ListMyConsentsService } from "src/hb-backend-api/consent/application/use-cases/list-my-consents.service";
import { ConsentController } from "src/hb-backend-api/consent/adapters/in/consent.controller";

/**
 * User consent to policy versions. Composes the policy CMS (PolicyModule, for the
 * current version to consent to) and the audit trail (AuditModule) — each
 * grant/withdraw is recorded as CONSENT_GIVEN / CONSENT_WITHDRAWN. Self-service:
 * the caller acts on their own consents.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConsentEntity.name, schema: ConsentSchema },
    ]),
    PolicyModule,
    AuditModule,
  ],
  controllers: [ConsentController],
  providers: [
    {
      provide: DIToken.ConsentModule.GrantConsentUseCase,
      useClass: GrantConsentService,
    },
    {
      provide: DIToken.ConsentModule.WithdrawConsentUseCase,
      useClass: WithdrawConsentService,
    },
    {
      provide: DIToken.ConsentModule.ListMyConsentsUseCase,
      useClass: ListMyConsentsService,
    },
    {
      provide: DIToken.ConsentModule.ConsentRepository,
      useClass: ConsentRepositoryImpl,
    },
    {
      provide: DIToken.ConsentModule.ConsentPersistencePort,
      useClass: ConsentPersistenceAdapter,
    },
    {
      provide: DIToken.ConsentModule.ConsentQueryPort,
      useClass: ConsentQueryAdapter,
    },
  ],
})
export class ConsentModule {}
