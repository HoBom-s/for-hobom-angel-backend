import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalCallback } from "src/hb-backend-api/approval/domain/ports/out/approval-callback";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { OutboxPayloadFactoryRegistry } from "src/hb-backend-api/outbox/domain/model/outbox-payload-factory.registry";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Completes a STAFF_PROMOTION decision. On approval it grants the candidate the
 * SHELTER_STAFF role scoped to the shelter carried in the request context, and
 * emits the notification event — inside the operator's decision transaction, so
 * the grant and the event commit atomically. Rejection needs no transition.
 */
@Injectable()
export class StaffPromotionCallback implements ApprovalCallback {
  public readonly type = ApprovalType.STAFF_PROMOTION;

  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
    @Inject(DIToken.OutboxModule.OutboxPersistencePort)
    private readonly outboxPersistencePort: OutboxPersistencePort,
  ) {}

  public async authorize(
    request: ApprovalRequest,
    actorId: string,
  ): Promise<void> {
    const shelterId = ShelterId.fromString(this.requireShelterId(request));
    const actor = await this.userQueryPort.findById(UserId.fromString(actorId));
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException(
        "해당 보호소의 관리자만 스태프 승격을 결정할 수 있어요.",
      );
    }
  }

  public async onApproved(request: ApprovalRequest): Promise<void> {
    const candidateId = UserId.fromString(request.getSubjectRef);
    const shelterId = ShelterId.fromString(this.requireShelterId(request));

    const candidate = await this.userQueryPort.findById(candidateId);
    if (!candidate) {
      throw new Error("승격 대상 회원을 찾을 수 없어요.");
    }
    candidate.promoteToShelterStaff(shelterId);
    await this.userPersistencePort.save(candidate);

    const now = new Date();
    await this.outboxPersistencePort.save(
      CreateOutboxEntity.of(
        EventType.STAFF_PROMOTION_APPROVED,
        OutboxPayloadFactoryRegistry[EventType.STAFF_PROMOTION_APPROVED]({
          subjectRef: candidateId.toString(),
          recipientUserId: candidateId.toString(),
          shelterId: shelterId.toString(),
          occurredAt: now.toISOString(),
        }),
      ),
    );
  }

  public onRejected(request: ApprovalRequest): Promise<void> {
    void request; // The rejected request row is the record; no grant to undo.
    return Promise.resolve();
  }

  private requireShelterId(request: ApprovalRequest): string {
    const shelterId = request.getContext?.shelterId;
    if (typeof shelterId !== "string") {
      throw new Error("스태프 승격 요청에 shelterId가 없어요.");
    }
    return shelterId;
  }
}
