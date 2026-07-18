import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { ListMyConsentsService } from "src/hb-backend-api/consent/application/use-cases/list-my-consents.service";

describe("ListMyConsentsService", () => {
  it("flags re-consent when the agreed version trails the current one", async () => {
    const policyQueryPort = {
      findCurrent: jest.fn().mockImplementation((type: PolicyType) => {
        if (type === PolicyType.PRIVACY_POLICY) {
          return { getVersion: 2 };
        }
        if (type === PolicyType.TERMS_OF_SERVICE) {
          return { getVersion: 1 };
        }
        return null; // OPERATING_POLICY not published
      }),
      findVersions: jest.fn(),
      nextVersion: jest.fn(),
    };
    const consentQueryPort = {
      findByUser: jest
        .fn()
        .mockResolvedValue([
          Consent.grant("u1", PolicyType.PRIVACY_POLICY, 1, new Date()),
          Consent.grant("u1", PolicyType.TERMS_OF_SERVICE, 1, new Date()),
        ]),
      findByUserAndType: jest.fn(),
    };
    const service = new ListMyConsentsService(
      policyQueryPort,
      consentQueryPort,
    );

    const views = await service.invoke("u1");

    // OPERATING_POLICY is skipped (no published version).
    expect(views).toHaveLength(2);
    const privacy = views.find(
      (v) => v.policyType === PolicyType.PRIVACY_POLICY,
    )!;
    const terms = views.find(
      (v) => v.policyType === PolicyType.TERMS_OF_SERVICE,
    )!;
    expect(privacy.needsConsent).toBe(true); // agreed v1 < current v2
    expect(terms.needsConsent).toBe(false); // agreed v1 == current v1
  });
});
