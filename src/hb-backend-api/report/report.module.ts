import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureModule } from "src/shared/erasure/erasure.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { ReportDestroyer } from "src/hb-backend-api/report/adapters/erasure/report.destroyer";
import { ReportEntity } from "src/hb-backend-api/report/domain/model/report.entity";
import { ReportSchema } from "src/hb-backend-api/report/domain/model/report.schema";
import { ReportPersistenceAdapter } from "src/hb-backend-api/report/adapters/out/report-persistence.adapter";
import { ReportQueryAdapter } from "src/hb-backend-api/report/adapters/out/report-query.adapter";
import { ReportRepositoryImpl } from "src/hb-backend-api/report/infra/repositories/report.repository.impl";
import { SubmitReportService } from "src/hb-backend-api/report/application/use-cases/submit-report.service";
import { ResolveReportService } from "src/hb-backend-api/report/application/use-cases/resolve-report.service";
import { ListPendingReportsService } from "src/hb-backend-api/report/application/use-cases/list-pending-reports.service";
import { ReportController } from "src/hb-backend-api/report/adapters/in/report.controller";

/**
 * Trust & Safety — members report animals/shelters/users, a platform operator
 * (SYSTEM_ADMIN) reviews the queue and resolves each with a verdict. Enforcing an
 * UPHELD verdict (blind/sanction) and the repeat-offender blacklist are separate
 * follow-ups.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReportEntity.name, schema: ReportSchema },
    ]),
    UserModule,
    ErasureModule,
  ],
  controllers: [ReportController],
  providers: [
    ReportDestroyer,
    {
      provide: DIToken.ReportModule.SubmitReportUseCase,
      useClass: SubmitReportService,
    },
    {
      provide: DIToken.ReportModule.ResolveReportUseCase,
      useClass: ResolveReportService,
    },
    {
      provide: DIToken.ReportModule.ListPendingReportsUseCase,
      useClass: ListPendingReportsService,
    },
    {
      provide: DIToken.ReportModule.ReportRepository,
      useClass: ReportRepositoryImpl,
    },
    {
      provide: DIToken.ReportModule.ReportPersistencePort,
      useClass: ReportPersistenceAdapter,
    },
    {
      provide: DIToken.ReportModule.ReportQueryPort,
      useClass: ReportQueryAdapter,
    },
  ],
})
export class ReportModule implements OnModuleInit {
  constructor(
    private readonly destroyerRegistry: DestroyerRegistry,
    private readonly reportDestroyer: ReportDestroyer,
  ) {}

  public onModuleInit(): void {
    this.destroyerRegistry.register(this.reportDestroyer);
  }
}
