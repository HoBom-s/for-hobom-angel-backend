import { PolicyStatus } from "src/hb-backend-api/policy/domain/enums/policy-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";

const publish = (
  over: Partial<Parameters<typeof PolicyDocument.publish>[0]> = {},
) =>
  PolicyDocument.publish({
    type: PolicyType.PRIVACY_POLICY,
    version: 1,
    title: "개인정보 처리방침",
    content: "수집 항목 ...",
    effectiveDate: new Date("2026-07-01"),
    now: new Date("2026-06-20"),
    ...over,
  });

describe("PolicyDocument", () => {
  it("publishes a new version in PUBLISHED status", () => {
    const doc = publish({ version: 3 });
    expect(doc.isPublished()).toBe(true);
    expect(doc.getStatus).toBe(PolicyStatus.PUBLISHED);
    expect(doc.getVersion).toBe(3);
    expect(doc.getType).toBe(PolicyType.PRIVACY_POLICY);
    expect(doc.getId).toBeNull();
  });

  it("trims the title and rejects blank title/content", () => {
    expect(publish({ title: "  약관  " }).getTitle).toBe("약관");
    expect(() => publish({ title: "   " })).toThrow("제목");
    expect(() => publish({ content: "  " })).toThrow("본문");
  });

  it("rejects a version below 1", () => {
    expect(() => publish({ version: 0 })).toThrow("버전");
  });
});
