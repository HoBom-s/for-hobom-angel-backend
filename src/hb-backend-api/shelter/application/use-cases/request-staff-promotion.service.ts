import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { SubmitApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/submit-approval.use-case";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  RequestStaffPromotionCommand,
  RequestStaffPromotionResult,
  RequestStaffPromotionUseCase,
} from "src/hb-backend-api/shelter/domain/ports/in/request-staff-promotion.use-case";

/**
 * A shelter admin requests promoting a member to staff. Only an admin of that
 * shelter may ask, and the candidate must be an active member who isn't already
 * staff there; the shelter's representative then decides the resulting
 * STAFF_PROMOTION approval. The shelterId rides in the request context so the
 * completion callback knows which shelter to scope the grant to.
 */
@Injectable()
export class RequestStaffPromotionService implements RequestStaffPromotionUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.ApprovalModule.SubmitApprovalUseCase)
    private readonly submitApprovalUseCase: SubmitApprovalUseCase,
  ) {}

  @Transactional()
  public async invoke(
    command: RequestStaffPromotionCommand,
  ): Promise<RequestStaffPromotionResult> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const requester = await this.userQueryPort.findById(
      UserId.fromString(command.requestedBy),
    );
    if (
      !requester ||
      !requester.hasShelterRole(shelterId, UserRole.SHELTER_ADMIN)
    ) {
      throw new ForbiddenException(
        "보호소 관리자만 스태프 승격을 요청할 수 있어요.",
      );
    }

    const candidate = await this.userQueryPort.findById(
      UserId.fromString(command.candidateUserId),
    );
    if (!candidate) {
      throw new NotFoundException("승격 대상 회원을 찾을 수 없어요.");
    }
    if (!candidate.isActive()) {
      throw new ForbiddenException("활성 회원만 스태프로 승격할 수 있어요.");
    }
    if (candidate.hasShelterRole(shelterId, UserRole.SHELTER_STAFF)) {
      throw new ForbiddenException("이미 해당 보호소의 스태프예요.");
    }

    const approvalId = await this.submitApprovalUseCase.invoke({
      type: ApprovalType.STAFF_PROMOTION,
      subjectRef: command.candidateUserId,
      requesterId: command.requestedBy,
      context: { shelterId: command.shelterId },
    });

    return { approvalId: approvalId.toString() };
  }
}
