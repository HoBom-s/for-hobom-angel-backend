import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AuditLogEntity } from "src/hb-backend-api/audit/domain/model/audit-log.entity";
import { AuditLogSchema } from "src/hb-backend-api/audit/domain/model/audit-log.schema";
import { AuditPersistenceAdapter } from "src/hb-backend-api/audit/adapters/out/audit-persistence.adapter";
import { AuditRepositoryImpl } from "src/hb-backend-api/audit/infra/repositories/audit.repository.impl";

/**
 * Compliance audit trail. Exposes {@link DIToken.AuditModule.AuditPersistencePort}
 * for use-cases that touch PII (unmasked reads, exports, deletions) to record
 * who did what to whom, and why.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLogEntity.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [
    {
      provide: DIToken.AuditModule.AuditPersistencePort,
      useClass: AuditPersistenceAdapter,
    },
    {
      provide: DIToken.AuditModule.AuditRepository,
      useClass: AuditRepositoryImpl,
    },
  ],
  exports: [DIToken.AuditModule.AuditPersistencePort],
})
export class AuditModule {}
