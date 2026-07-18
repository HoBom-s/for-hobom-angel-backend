import { ConsentStatus } from "src/hb-backend-api/consent/domain/enums/consent-status.enum";
import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

describe("Consent", () => {
  const now = new Date("2026-07-01");

  it("grants consent at a version", () => {
    const c = Consent.grant("u1", PolicyType.PRIVACY_POLICY, 1, now);
    expect(c.isGranted()).toBe(true);
    expect(c.getAgreedVersion).toBe(1);
    expect(c.getWithdrawnAt).toBeNull();
  });

  it("re-grants to a newer version, clearing withdrawal", () => {
    const c = Consent.grant("u1", PolicyType.PRIVACY_POLICY, 1, now);
    c.withdraw(now);
    c.reGrant(2, new Date("2026-08-01"));
    expect(c.isGranted()).toBe(true);
    expect(c.getAgreedVersion).toBe(2);
    expect(c.getWithdrawnAt).toBeNull();
  });

  it("withdraws a granted consent", () => {
    const c = Consent.grant("u1", PolicyType.PRIVACY_POLICY, 1, now);
    c.withdraw(new Date("2026-09-01"));
    expect(c.getStatus).toBe(ConsentStatus.WITHDRAWN);
    expect(c.getWithdrawnAt).not.toBeNull();
  });

  it("rejects withdrawing when not granted", () => {
    const c = Consent.grant("u1", PolicyType.PRIVACY_POLICY, 1, now);
    c.withdraw(now);
    expect(() => c.withdraw(now)).toThrow("동의");
  });
});
