import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { CreateApprovalAction } from "src/hb-backend-api/approval/domain/model/create-approval-action";
import { ApprovalPersistencePort } from "src/hb-backend-api/approval/domain/ports/out/approval-persistence.port";
import { ApprovalRepository } from "src/hb-backend-api/approval/domain/repositories/approval.repository";

@Injectable()
export class ApprovalPersistenceAdapter implements ApprovalPersistencePort {
  constructor(
    @Inject(DIToken.ApprovalModule.ApprovalRepository)
    private readonly approvalRepository: ApprovalRepository,
  ) {}

  public create(request: ApprovalRequest): Promise<void> {
    return this.approvalRepository.insertRequest({
      _id: request.getId.raw,
      type: request.getType,
      subjectRef: request.getSubjectRef,
      requesterId: request.getRequesterId,
      status: request.getStatus,
      version: request.getVersion,
    });
  }

  public save(request: ApprovalRequest): Promise<void> {
    return this.approvalRepository.updateRequest(
      request.getId.raw,
      request.getVersion,
      {
        status: request.getStatus,
        decidedBy: request.getDecidedBy ?? undefined,
        decidedAt: request.getDecidedAt ?? undefined,
        reason: request.getReason ?? undefined,
        decisionMetadata: request.getDecisionMetadata ?? undefined,
      },
    );
  }

  public appendAction(action: CreateApprovalAction): Promise<void> {
    return this.approvalRepository.insertAction({
      requestId: action.requestId,
      actorId: action.actorId,
      action: action.action,
      reason: action.reason ?? undefined,
    });
  }
}
