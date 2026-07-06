import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";

describe("AuditEvent", () => {
  it("builds a complete event", () => {
    const e = AuditEvent.of({
      action: AuditAction.VIEW_PII,
      actorId: "operator-1",
      subjectUserId: "user-9",
      field: "phone",
      reason: "support ticket #12",
      traceId: "trace-1",
    });
    expect(e.action).toBe(AuditAction.VIEW_PII);
    expect(e.actorId).toBe("operator-1");
    expect(e.subjectUserId).toBe("user-9");
    expect(e.field).toBe("phone");
  });

  it("defaults optional fields to null", () => {
    const e = AuditEvent.of({
      action: AuditAction.DELETE_PII,
      actorId: "a",
      subjectUserId: "b",
    });
    expect(e.field).toBeNull();
    expect(e.reason).toBeNull();
    expect(e.traceId).toBeNull();
  });

  it("cannot be built without actor or subject", () => {
    expect(() =>
      AuditEvent.of({
        action: AuditAction.VIEW_PII,
        actorId: "  ",
        subjectUserId: "b",
      }),
    ).toThrow();
    expect(() =>
      AuditEvent.of({
        action: AuditAction.VIEW_PII,
        actorId: "a",
        subjectUserId: "",
      }),
    ).toThrow();
  });
});
