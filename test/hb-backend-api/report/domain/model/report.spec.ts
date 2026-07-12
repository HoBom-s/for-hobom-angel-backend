import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { ReportReason } from "src/hb-backend-api/report/domain/enums/report-reason.enum";
import { ReportResolution } from "src/hb-backend-api/report/domain/enums/report-resolution.enum";
import { ReportStatus } from "src/hb-backend-api/report/domain/enums/report-status.enum";
import { ReportTargetType } from "src/hb-backend-api/report/domain/enums/report-target-type.enum";
import { Report } from "src/hb-backend-api/report/domain/model/report";

const submit = (over: Partial<Parameters<typeof Report.submit>[0]> = {}) =>
  Report.submit({
    reporterId: UserId.generate(),
    targetType: ReportTargetType.ANIMAL,
    targetRef: "animal-1",
    reason: ReportReason.ANIMAL_ABUSE,
    ...over,
  });

describe("Report", () => {
  it("starts PENDING", () => {
    const report = submit();
    expect(report.getStatus).toBe(ReportStatus.PENDING);
    expect(report.isPending()).toBe(true);
    expect(report.getResolution).toBeNull();
  });

  it("rejects an empty target and an over-long detail", () => {
    expect(() => submit({ targetRef: "  " })).toThrow("대상");
    expect(() => submit({ detail: "a".repeat(2001) })).toThrow("최대");
  });

  it("resolves once, recording the verdict", () => {
    const report = submit();
    const operator = UserId.generate();
    report.resolve(
      operator,
      ReportResolution.UPHELD,
      "제재 처리",
      new Date("2026-07-13"),
    );
    expect(report.getStatus).toBe(ReportStatus.RESOLVED);
    expect(report.getResolution).toBe(ReportResolution.UPHELD);
    expect(report.getResolvedBy?.equals(operator)).toBe(true);
    expect(() =>
      report.resolve(operator, ReportResolution.DISMISSED, "", new Date()),
    ).toThrow("이미 처리된");
  });
});
