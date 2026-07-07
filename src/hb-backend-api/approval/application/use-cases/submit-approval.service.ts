import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalActionType } from "src/hb-backend-api/approval/domain/enums/approval-action-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { CreateApprovalAction } from "src/hb-backend-api/approval/domain/model/create-approval-action";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import {
  SubmitApprovalCommand,
  SubmitApprovalUseCase,
} from "src/hb-backend-api/approval/domain/ports/in/submit-approval.use-case";
import { ApprovalPersistencePort } from "src/hb-backend-api/approval/domain/ports/out/approval-persistence.port";

/**
 * Opens a pending approval request. NOT transactional itself — it is meant to be
 * called inside a consumer's transaction (e.g. shelter registration), so the
 * request and the domain state that triggered it commit together.
 */
@Injectable()
export class SubmitApprovalService implements SubmitApprovalUseCase {
  constructor(
    @Inject(DIToken.ApprovalModule.ApprovalPersistencePort)
    private readonly approvalPersistencePort: ApprovalPersistencePort,
  ) {}

  public async invoke(command: SubmitApprovalCommand): Promise<ApprovalId> {
    const request = ApprovalRequest.submit(command);
    await this.approvalPersistencePort.create(request);
    await this.approvalPersistencePort.appendAction(
      CreateApprovalAction.of({
        requestId: request.getId.toString(),
        actorId: command.requesterId,
        action: ApprovalActionType.SUBMIT,
      }),
    );
    return request.getId;
  }
}
