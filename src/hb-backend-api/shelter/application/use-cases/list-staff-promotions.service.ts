import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerActivityPort } from "src/hb-backend-api/shelter/domain/ports/out/volunteer-activity.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  ListStaffPromotionsQuery,
  ListStaffPromotionsUseCase,
  StaffPromotionRequestView,
} from "src/hb-backend-api/shelter/domain/ports/in/list-staff-promotions.use-case";

/**
 * The shelter's pending staff-promotion queue — one card per open request, each
 * enriched with the candidate's track record (nickname, sign-up date, approved
 * volunteer count) so the representative can decide. Staff-only. Approve/reject
 * is a separate action against POST /approvals/:id/decision, hence each row
 * carries its approvalId. A candidate whose account no longer resolves (e.g.
 * withdrawn between request and read) is dropped rather than shown blank.
 */
@Injectable()
export class ListStaffPromotionsService implements ListStaffPromotionsUseCase {
  private static readonly MAX_PENDING = 100;

  constructor(
    @Inject(DIToken.ApprovalModule.ApprovalQueryPort)
    private readonly approvalQueryPort: ApprovalQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.ShelterModule.VolunteerActivityPort)
    private readonly volunteerActivityPort: VolunteerActivityPort,
  ) {}

  public async invoke(
    query: ListStaffPromotionsQuery,
  ): Promise<StaffPromotionRequestView[]> {
    const shelterId = ShelterId.fromString(query.shelterId);
    const actor = await this.userQueryPort.findById(
      UserId.fromString(query.actorId),
    );
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 담당자만 승격 요청을 볼 수 있어요.");
    }

    const requests = await this.approvalQueryPort.findPendingByTypeAndShelter(
      ApprovalType.STAFF_PROMOTION,
      query.shelterId,
      ListStaffPromotionsService.MAX_PENDING,
    );

    const views = await Promise.all(requests.map((r) => this.enrich(r)));
    return views.filter((v): v is StaffPromotionRequestView => v !== null);
  }

  private async enrich(
    request: ApprovalRequest,
  ): Promise<StaffPromotionRequestView | null> {
    const candidateUserId = request.getSubjectRef;
    const candidate = await this.userQueryPort.findById(
      UserId.fromString(candidateUserId),
    );
    if (!candidate) {
      return null;
    }
    const volunteerCount =
      await this.volunteerActivityPort.countApprovedByVolunteer(
        candidateUserId,
      );
    return {
      approvalId: request.getId.toString(),
      candidateUserId,
      candidateNickname: candidate.getNickname.raw,
      candidateJoinedAt: candidate.getCreatedAt,
      volunteerCount,
    };
  }
}
