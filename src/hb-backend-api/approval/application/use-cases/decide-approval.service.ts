import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { CreateApprovalAction } from "src/hb-backend-api/approval/domain/model/create-approval-action";
import {
  DecideApprovalCommand,
  DecideApprovalUseCase,
} from "src/hb-backend-api/approval/domain/ports/in/decide-approval.use-case";
import { ApprovalPersistencePort } from "src/hb-backend-api/approval/domain/ports/out/approval-persistence.port";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { ApprovalCallbackRegistry } from "src/hb-backend-api/approval/application/approval-callback.registry";

/**
 * The operator's decision. Transitions the request, appends the audit action,
 * and runs the type-specific callback (which transitions the target aggregate)
 * — all in ONE transaction, so the decision and its domain effect commit
 * together or not at all.
 */
@Injectable()
export class DecideApprovalService implements DecideApprovalUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ApprovalModule.ApprovalQueryPort)
    private readonly approvalQueryPort: ApprovalQueryPort,
    @Inject(DIToken.ApprovalModule.ApprovalPersistencePort)
    private readonly approvalPersistencePort: ApprovalPersistencePort,
    private readonly callbacks: ApprovalCallbackRegistry,
  ) {}

  @Transactional()
  public async invoke(command: DecideApprovalCommand): Promise<void> {
    const request = await this.approvalQueryPort.findById(command.requestId);
    if (!request) {
      throw new NotFoundException("승인 요청을 찾을 수 없어요.");
    }
    // Resolve the callback before mutating — fail fast if the type is unwired.
    const callback = this.callbacks.get(request.getType);
    const now = new Date();

    if (command.decision.isApprove()) {
      request.approve(command.actorId, now, command.metadata, command.reason);
    } else {
      request.reject(command.actorId, now, command.reason ?? "");
    }

    await this.approvalPersistencePort.save(request);
    await this.approvalPersistencePort.appendAction(
      CreateApprovalAction.of({
        requestId: request.getId.toString(),
        actorId: command.actorId,
        action: command.decision.actionType,
        reason: command.reason,
      }),
    );

    if (request.isApproved()) {
      await callback.onApproved(request);
    } else {
      await callback.onRejected(request);
    }
  }
}
