import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { Report } from "src/hb-backend-api/report/domain/model/report";
import { ReportPersistencePort } from "src/hb-backend-api/report/domain/ports/out/report-persistence.port";
import {
  SubmitReportCommand,
  SubmitReportResult,
  SubmitReportUseCase,
} from "src/hb-backend-api/report/domain/ports/in/submit-report.use-case";

/** Files a report into the operator queue. Any active member may report. */
@Injectable()
export class SubmitReportService implements SubmitReportUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ReportModule.ReportPersistencePort)
    private readonly reportPersistencePort: ReportPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(
    command: SubmitReportCommand,
  ): Promise<SubmitReportResult> {
    const reporter = await this.userQueryPort.findById(
      UserId.fromString(command.reporterId),
    );
    if (!reporter || !reporter.isActive()) {
      throw new ForbiddenException("활성 회원만 신고할 수 있어요.");
    }

    const report = Report.submit({
      reporterId: reporter.getId,
      targetType: command.targetType,
      targetRef: command.targetRef,
      reason: command.reason,
      detail: command.detail,
    });
    await this.reportPersistencePort.create(report);

    return { reportId: report.getId.toString() };
  }
}
