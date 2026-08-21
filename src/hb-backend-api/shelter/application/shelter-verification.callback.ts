import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalCallback } from "src/hb-backend-api/approval/domain/ports/out/approval-callback";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { OutboxPayloadFactoryRegistry } from "src/hb-backend-api/outbox/domain/model/outbox-payload-factory.registry";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterPersistencePort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-persistence.port";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { NotificationType } from "src/hb-backend-api/notification/domain/enums/notification-type.enum";
import { NotifyUseCase } from "src/hb-backend-api/notification/domain/ports/in/notify.use-case";

/**
 * Completes a SHELTER_VERIFICATION decision. On approval it verifies the shelter,
 * grants the registrant SHELTER_ADMIN, and emits the notification event — all
 * inside the operator's decision transaction (the engine invokes this within it),
 * so shelter status, the admin grant and the event commit atomically. The trust
 * tier rides in the decision metadata; it defaults to A because registration
 * already required organizational proof.
 */
@Injectable()
export class ShelterVerificationCallback implements ApprovalCallback {
  public readonly type = ApprovalType.SHELTER_VERIFICATION;

  constructor(
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.ShelterModule.ShelterPersistencePort)
    private readonly shelterPersistencePort: ShelterPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
    @Inject(DIToken.OutboxModule.OutboxPersistencePort)
    private readonly outboxPersistencePort: OutboxPersistencePort,
    @Inject(DIToken.NotificationModule.NotifyUseCase)
    private readonly notifyUseCase: NotifyUseCase,
  ) {}

  public async authorize(
    request: ApprovalRequest,
    actorId: string,
  ): Promise<void> {
    void request;
    const actor = await this.userQueryPort.findById(UserId.fromString(actorId));
    if (!actor || !actor.isPlatformAdmin()) {
      throw new ForbiddenException("보호소 검증은 운영자만 결정할 수 있어요.");
    }
  }

  public async onApproved(request: ApprovalRequest): Promise<void> {
    const shelterId = ShelterId.fromString(request.getSubjectRef);
    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new Error("승인 대상 보호소를 찾을 수 없어요.");
    }

    const now = new Date();
    shelter.approve(now, this.resolveTier(request));
    await this.shelterPersistencePort.save(shelter);

    const representativeId = UserId.fromString(request.getRequesterId);
    const representative = await this.userQueryPort.findById(representativeId);
    if (!representative) {
      throw new Error("보호소 대표 회원을 찾을 수 없어요.");
    }
    representative.grantShelterAdmin(shelterId);
    await this.userPersistencePort.save(representative);

    await this.outboxPersistencePort.save(
      CreateOutboxEntity.of(
        EventType.SHELTER_VERIFICATION_APPROVED,
        OutboxPayloadFactoryRegistry[EventType.SHELTER_VERIFICATION_APPROVED]({
          subjectRef: shelterId.toString(),
          recipientUserId: representativeId.toString(),
          shelterId: shelterId.toString(),
          occurredAt: now.toISOString(),
        }),
      ),
    );
    await this.notifyUseCase.notify({
      recipientId: representativeId.toString(),
      type: NotificationType.SHELTER_VERIFICATION_APPROVED,
      subjectRef: shelterId.toString(),
      context: { shelterId: shelterId.toString() },
    });
  }

  public async onRejected(request: ApprovalRequest): Promise<void> {
    const shelterId = ShelterId.fromString(request.getSubjectRef);
    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new Error("반려 대상 보호소를 찾을 수 없어요.");
    }
    shelter.reject(request.getReason ?? "심사에서 반려되었어요.");
    await this.shelterPersistencePort.save(shelter);

    await this.notifyUseCase.notify({
      recipientId: request.getRequesterId,
      type: NotificationType.SHELTER_VERIFICATION_REJECTED,
      subjectRef: shelterId.toString(),
      context: { reason: request.getReason ?? null },
    });
  }

  private resolveTier(request: ApprovalRequest): TrustTier {
    return request.getDecisionMetadata?.trustTier === TrustTier.B
      ? TrustTier.B
      : TrustTier.A;
  }
}
