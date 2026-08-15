import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { DecideApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/decide-approval.use-case";
import {
  DecideBySubjectRefCommand,
  DecideBySubjectRefUseCase,
} from "src/hb-backend-api/approval/domain/ports/in/decide-by-subject-ref.use-case";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";

/**
 * Resolves the PENDING approval for (subjectRef, type) and delegates to
 * {@link DecideApprovalUseCase}, which authorizes the actor and runs the type
 * callback in its own transaction. Missing approval → 404 (already decided,
 * or never opened for this subject).
 */
@Injectable()
export class DecideBySubjectRefService implements DecideBySubjectRefUseCase {
  constructor(
    @Inject(DIToken.ApprovalModule.ApprovalQueryPort)
    private readonly approvalQueryPort: ApprovalQueryPort,
    @Inject(DIToken.ApprovalModule.DecideApprovalUseCase)
    private readonly decideApprovalUseCase: DecideApprovalUseCase,
  ) {}

  public async invoke(command: DecideBySubjectRefCommand): Promise<void> {
    const request = await this.approvalQueryPort.findPendingBySubjectRef(
      command.subjectRef,
      command.type,
    );
    if (!request) {
      throw new NotFoundException("결정 대기 중인 신청을 찾을 수 없어요.");
    }
    await this.decideApprovalUseCase.invoke({
      requestId: request.getId,
      actorId: command.actorId,
      decision: command.decision,
      reason: command.reason,
    });
  }
}
