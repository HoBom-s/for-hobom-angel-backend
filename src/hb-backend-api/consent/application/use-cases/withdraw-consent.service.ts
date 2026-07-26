import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";
import { AuditPersistencePort } from "src/hb-backend-api/audit/domain/ports/out/audit-persistence.port";
import { ConsentPersistencePort } from "src/hb-backend-api/consent/domain/ports/out/consent-persistence.port";
import { ConsentQueryPort } from "src/hb-backend-api/consent/domain/ports/out/consent-query.port";
import {
  WithdrawConsentCommand,
  WithdrawConsentUseCase,
} from "src/hb-backend-api/consent/domain/ports/in/withdraw-consent.use-case";

/** Withdraws a member's standing consent, recording CONSENT_WITHDRAWN. */
@Injectable()
export class WithdrawConsentService implements WithdrawConsentUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ConsentModule.ConsentQueryPort)
    private readonly consentQueryPort: ConsentQueryPort,
    @Inject(DIToken.ConsentModule.ConsentPersistencePort)
    private readonly consentPersistencePort: ConsentPersistencePort,
    @Inject(DIToken.AuditModule.AuditPersistencePort)
    private readonly audit: AuditPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: WithdrawConsentCommand): Promise<void> {
    const existing = await this.consentQueryPort.findByUserAndType(
      command.userId,
      command.policyType,
    );
    if (!existing || !existing.isGranted()) {
      throw new NotFoundException("동의한 내역이 없어요.");
    }

    existing.withdraw(new Date());
    await this.consentPersistencePort.save(existing);

    await this.audit.record(
      AuditEvent.of({
        action: AuditAction.CONSENT_WITHDRAWN,
        actorId: command.userId,
        subjectUserId: command.userId,
        field: command.policyType,
        reason: `version ${existing.getAgreedVersion}`,
      }),
    );
  }
}
