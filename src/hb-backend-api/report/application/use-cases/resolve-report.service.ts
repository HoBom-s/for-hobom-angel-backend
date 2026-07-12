import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { ReportId } from "src/hb-backend-api/report/domain/model/vo/report-id.vo";
import { ReportPersistencePort } from "src/hb-backend-api/report/domain/ports/out/report-persistence.port";
import { ReportQueryPort } from "src/hb-backend-api/report/domain/ports/out/report-query.port";
import {
  ResolveReportCommand,
  ResolveReportUseCase,
} from "src/hb-backend-api/report/domain/ports/in/resolve-report.use-case";

/**
 * A platform operator resolves a report with a verdict. Only a SYSTEM_ADMIN may
 * resolve; enforcing an UPHELD verdict (blind/sanction) is a separate step.
 */
@Injectable()
export class ResolveReportService implements ResolveReportUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ReportModule.ReportQueryPort)
    private readonly reportQueryPort: ReportQueryPort,
    @Inject(DIToken.ReportModule.ReportPersistencePort)
    private readonly reportPersistencePort: ReportPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: ResolveReportCommand): Promise<void> {
    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.resolvedBy),
    );
    if (!actor || !actor.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 신고를 처리할 수 있어요.");
    }

    const report = await this.reportQueryPort.findById(
      ReportId.fromString(command.reportId),
    );
    if (!report) {
      throw new NotFoundException("신고를 찾을 수 없어요.");
    }

    report.resolve(
      actor.getId,
      command.resolution,
      command.note ?? "",
      new Date(),
    );
    await this.reportPersistencePort.save(report);
  }
}
