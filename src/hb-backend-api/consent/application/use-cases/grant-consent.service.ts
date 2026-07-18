import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";
import { AuditPersistencePort } from "src/hb-backend-api/audit/domain/ports/out/audit-persistence.port";
import { PolicyQueryPort } from "src/hb-backend-api/policy/domain/ports/out/policy-query.port";
import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { ConsentPersistencePort } from "src/hb-backend-api/consent/domain/ports/out/consent-persistence.port";
import { ConsentQueryPort } from "src/hb-backend-api/consent/domain/ports/out/consent-query.port";
import {
  GrantConsentCommand,
  GrantConsentUseCase,
} from "src/hb-backend-api/consent/domain/ports/in/grant-consent.use-case";

/**
 * Records a member's consent to the current version of a policy. The submitted
 * version must match the published one (you consent to what you were shown), so
 * a stale form can't silently record consent to an outdated document. The
 * standing consent is upserted and a CONSENT_GIVEN audit entry written atomically
 * — the audit module's consent-history consumer.
 */
@Injectable()
export class GrantConsentService implements GrantConsentUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.PolicyModule.PolicyQueryPort)
    private readonly policyQueryPort: PolicyQueryPort,
    @Inject(DIToken.ConsentModule.ConsentQueryPort)
    private readonly consentQueryPort: ConsentQueryPort,
    @Inject(DIToken.ConsentModule.ConsentPersistencePort)
    private readonly consentPersistencePort: ConsentPersistencePort,
    @Inject(DIToken.AuditModule.AuditPersistencePort)
    private readonly audit: AuditPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: GrantConsentCommand): Promise<Consent> {
    const current = await this.policyQueryPort.findCurrent(command.policyType);
    if (!current) {
      throw new BadRequestException("게시된 정책이 없어요.");
    }
    if (command.policyVersion !== current.getVersion) {
      throw new BadRequestException("최신 버전의 정책에 동의해 주세요.");
    }

    const now = new Date();
    const existing = await this.consentQueryPort.findByUserAndType(
      command.userId,
      command.policyType,
    );

    let consent: Consent;
    if (existing) {
      existing.reGrant(command.policyVersion, now);
      consent = await this.consentPersistencePort.save(existing);
    } else {
      consent = await this.consentPersistencePort.create(
        Consent.grant(
          command.userId,
          command.policyType,
          command.policyVersion,
          now,
        ),
      );
    }

    await this.audit.record(
      AuditEvent.of({
        action: AuditAction.CONSENT_GIVEN,
        actorId: command.userId,
        subjectUserId: command.userId,
        field: command.policyType,
        reason: `version ${command.policyVersion}`,
      }),
    );

    return consent;
  }
}
