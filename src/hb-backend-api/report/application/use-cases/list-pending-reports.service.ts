import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { Report } from "src/hb-backend-api/report/domain/model/report";
import { ReportQueryPort } from "src/hb-backend-api/report/domain/ports/out/report-query.port";
import {
  ListPendingReportsQuery,
  ListPendingReportsUseCase,
} from "src/hb-backend-api/report/domain/ports/in/list-pending-reports.use-case";

/** The operator moderation queue. Only a SYSTEM_ADMIN may view it. */
@Injectable()
export class ListPendingReportsService implements ListPendingReportsUseCase {
  constructor(
    @Inject(DIToken.ReportModule.ReportQueryPort)
    private readonly reportQueryPort: ReportQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(query: ListPendingReportsQuery): Promise<Report[]> {
    const viewer = await this.userQueryPort.findById(
      UserId.fromString(query.viewerId),
    );
    if (!viewer || !viewer.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 신고 목록을 볼 수 있어요.");
    }
    return this.reportQueryPort.findPending(query.limit);
  }
}
