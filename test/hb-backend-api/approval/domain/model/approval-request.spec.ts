import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";

const submit = () =>
  ApprovalRequest.submit({
    type: ApprovalType.SHELTER_VERIFICATION,
    subjectRef: "shelter-1",
    requesterId: "user-1",
  });

const at = new Date("2026-07-07T00:00:00Z");

describe("ApprovalRequest", () => {
  it("submits as PENDING", () => {
    const req = submit();
    expect(req.getStatus).toBe(ApprovalStatus.PENDING);
    expect(req.getType).toBe(ApprovalType.SHELTER_VERIFICATION);
    expect(req.getSubjectRef).toBe("shelter-1");
    expect(req.isPending()).toBe(true);
  });

  it("requires subject and requester", () => {
    expect(() =>
      ApprovalRequest.submit({
        type: ApprovalType.ADOPTION,
        subjectRef: " ",
        requesterId: "u",
      }),
    ).toThrow();
  });

  it("approve moves PENDING -> APPROVED and stores decision metadata", () => {
    const req = submit();
    req.approve("operator-1", at, { tier: "A" }, "확인 완료");
    expect(req.getStatus).toBe(ApprovalStatus.APPROVED);
    expect(req.isApproved()).toBe(true);
    expect(req.getDecidedBy).toBe("operator-1");
    expect(req.getDecidedAt).toEqual(at);
    expect(req.getDecisionMetadata).toEqual({ tier: "A" });
  });

  it("reject requires a reason and moves PENDING -> REJECTED", () => {
    const req = submit();
    expect(() => req.reject("operator-1", at, "  ")).toThrow();
    req.reject("operator-1", at, "서류 불충분");
    expect(req.getStatus).toBe(ApprovalStatus.REJECTED);
    expect(req.getReason).toBe("서류 불충분");
  });

  it("cancel moves PENDING -> CANCELLED", () => {
    const req = submit();
    req.cancel("user-1", at);
    expect(req.getStatus).toBe(ApprovalStatus.CANCELLED);
  });

  it("cannot decide a request that is already terminal", () => {
    const req = submit();
    req.approve("operator-1", at);
    expect(() => req.approve("operator-2", at)).toThrow();
    expect(() => req.reject("operator-2", at, "x")).toThrow();
    expect(() => req.cancel("user-1", at)).toThrow();
  });

  it("reconstitute round-trips state", () => {
    const req = ApprovalRequest.reconstitute({
      id: ApprovalId.generate(),
      type: ApprovalType.FOSTER,
      subjectRef: "foster-9",
      requesterId: "user-9",
      status: ApprovalStatus.APPROVED,
      decidedBy: "op",
      decidedAt: at,
      reason: null,
      decisionMetadata: { note: "ok" },
      version: 3,
    });
    expect(req.getStatus).toBe(ApprovalStatus.APPROVED);
    expect(req.getVersion).toBe(3);
    expect(req.getDecisionMetadata).toEqual({ note: "ok" });
  });
});
