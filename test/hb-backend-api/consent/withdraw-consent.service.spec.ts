import { NotFoundException } from "@nestjs/common";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { WithdrawConsentService } from "src/hb-backend-api/consent/application/use-cases/withdraw-consent.service";

describe("WithdrawConsentService", () => {
  const build = (existing: Consent | null) => {
    const txRunner = {
      run: (fn: () => Promise<unknown>) => fn(),
    } as unknown as TransactionRunner;
    const consentQueryPort = {
      findByUser: jest.fn(),
      findByUserAndType: jest.fn().mockResolvedValue(existing),
    };
    const persistencePort = {
      create: jest.fn(),
      save: jest.fn((c: Consent) => Promise.resolve(c)),
    };
    const audit = { record: jest.fn() };
    const service = new WithdrawConsentService(
      txRunner,
      consentQueryPort,
      persistencePort,
      audit,
    );
    return { service, persistencePort, audit };
  };

  const cmd = () => ({ userId: "u1", policyType: PolicyType.PRIVACY_POLICY });

  it("404s when there is no granted consent", async () => {
    const { service } = build(null);
    await expect(service.invoke(cmd())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("withdraws and records CONSENT_WITHDRAWN", async () => {
    const existing = Consent.grant(
      "u1",
      PolicyType.PRIVACY_POLICY,
      1,
      new Date(),
    );
    const { service, persistencePort, audit } = build(existing);
    await service.invoke(cmd());
    expect(persistencePort.save).toHaveBeenCalledTimes(1);
    expect(existing.isGranted()).toBe(false);
    expect(
      (audit.record.mock.calls[0][0] as { action: AuditAction }).action,
    ).toBe(AuditAction.CONSENT_WITHDRAWN);
  });
});
