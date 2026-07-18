import { BadRequestException } from "@nestjs/common";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { GrantConsentService } from "src/hb-backend-api/consent/application/use-cases/grant-consent.service";

describe("GrantConsentService", () => {
  const build = (
    over: { current?: unknown; existing?: Consent | null } = {},
  ) => {
    const txRunner = {
      run: (fn: () => Promise<unknown>) => fn(),
    } as unknown as TransactionRunner;
    const policyQueryPort = {
      findCurrent: jest
        .fn()
        .mockResolvedValue(
          over.current === undefined ? { getVersion: 1 } : over.current,
        ),
      findVersions: jest.fn(),
      nextVersion: jest.fn(),
    };
    const consentQueryPort = {
      findByUser: jest.fn(),
      findByUserAndType: jest.fn().mockResolvedValue(over.existing ?? null),
    };
    const persistencePort = {
      create: jest.fn((c: Consent) => Promise.resolve(c)),
      save: jest.fn((c: Consent) => Promise.resolve(c)),
    };
    const audit = { record: jest.fn() };
    const service = new GrantConsentService(
      txRunner,
      policyQueryPort,
      consentQueryPort,
      persistencePort,
      audit,
    );
    return { service, persistencePort, audit };
  };

  const cmd = () => ({
    userId: "u1",
    policyType: PolicyType.PRIVACY_POLICY,
    policyVersion: 1,
  });

  it("rejects when no policy is published", async () => {
    const { service } = build({ current: null });
    await expect(service.invoke(cmd())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects consenting to a stale (non-current) version", async () => {
    const { service } = build({ current: { getVersion: 2 } });
    await expect(service.invoke(cmd())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("creates a new consent and records CONSENT_GIVEN", async () => {
    const { service, persistencePort, audit } = build();
    await service.invoke(cmd());
    expect(persistencePort.create).toHaveBeenCalledTimes(1);
    expect(
      (audit.record.mock.calls[0][0] as { action: AuditAction }).action,
    ).toBe(AuditAction.CONSENT_GIVEN);
  });

  it("re-grants an existing consent", async () => {
    const existing = Consent.grant(
      "u1",
      PolicyType.PRIVACY_POLICY,
      0,
      new Date(),
    );
    const { service, persistencePort } = build({ existing });
    await service.invoke(cmd());
    expect(persistencePort.save).toHaveBeenCalledTimes(1);
    expect(existing.getAgreedVersion).toBe(1);
  });
});
