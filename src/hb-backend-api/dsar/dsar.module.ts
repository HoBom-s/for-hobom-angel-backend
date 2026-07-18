import { Module } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ErasureModule } from "src/shared/erasure/erasure.module";
import { AuditModule } from "src/hb-backend-api/audit/audit.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { DsarController } from "src/hb-backend-api/dsar/adapters/in/dsar.controller";
import { ErasureWorker } from "src/hb-backend-api/dsar/schedule/erasure.worker";
import { ExportPersonalDataService } from "src/hb-backend-api/dsar/application/use-cases/export-personal-data.service";
import { GetErasureRequestService } from "src/hb-backend-api/dsar/application/use-cases/get-erasure-request.service";
import { ListSubjectErasuresService } from "src/hb-backend-api/dsar/application/use-cases/list-subject-erasures.service";

/**
 * DSAR surface. Two responsibilities: the daily 03:00 erasure sweep
 * ({@link ErasureWorker}, where destruction actually happens) and the read-only
 * operator API (PII access + erasure lookup). Composes the erasure engine
 * (ErasureModule), the PII port + admin authz (UserModule) and the audit trail
 * (AuditModule); owns no store of its own.
 */
@Module({
  imports: [ErasureModule, UserModule, AuditModule],
  controllers: [DsarController],
  providers: [
    ErasureWorker,
    {
      provide: DIToken.DsarModule.ExportPersonalDataUseCase,
      useClass: ExportPersonalDataService,
    },
    {
      provide: DIToken.DsarModule.GetErasureRequestUseCase,
      useClass: GetErasureRequestService,
    },
    {
      provide: DIToken.DsarModule.ListSubjectErasuresUseCase,
      useClass: ListSubjectErasuresService,
    },
  ],
})
export class DsarModule {}
