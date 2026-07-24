import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  CountPendingApprovalsQuery,
  CountPendingApprovalsUseCase,
} from "src/hb-backend-api/approval/domain/ports/in/count-pending-approvals.use-case";

/** Pending counts per type for the operator queue's tab badges. Operator only. */
@Injectable()
export class CountPendingApprovalsService implements CountPendingApprovalsUseCase {
  constructor(
    @Inject(DIToken.ApprovalModule.ApprovalQueryPort)
    private readonly approvalQueryPort: ApprovalQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    query: CountPendingApprovalsQuery,
  ): Promise<Record<ApprovalType, number>> {
    const viewer = await this.userQueryPort.findById(
      UserId.fromString(query.viewerId),
    );
    if (!viewer || !viewer.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 승인 큐를 볼 수 있어요.");
    }
    return this.approvalQueryPort.countPendingByType();
  }
}
