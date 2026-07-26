import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  ListPendingApprovalsQuery,
  ListPendingApprovalsUseCase,
} from "src/hb-backend-api/approval/domain/ports/in/list-pending-approvals.use-case";

/**
 * The operator's global pending-approval queue across all shelters — optionally
 * one type, cursor-paged. Only a SYSTEM_ADMIN may view it. The engine stays
 * domain-agnostic: each row carries its raw `context`, not resolved cross-domain
 * detail, which the client renders per type.
 */
@Injectable()
export class ListPendingApprovalsService implements ListPendingApprovalsUseCase {
  constructor(
    @Inject(DIToken.ApprovalModule.ApprovalQueryPort)
    private readonly approvalQueryPort: ApprovalQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    query: ListPendingApprovalsQuery,
  ): Promise<Page<ApprovalRequest>> {
    const viewer = await this.userQueryPort.findById(
      UserId.fromString(query.viewerId),
    );
    if (!viewer || !viewer.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 승인 큐를 볼 수 있어요.");
    }
    return this.approvalQueryPort.findPending(
      query.type ?? null,
      query.cursor ?? null,
      query.limit,
    );
  }
}
