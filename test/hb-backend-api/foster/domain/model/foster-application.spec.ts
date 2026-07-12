import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

const submit = (plannedEndDate: Date | null = new Date("2026-09-01")) =>
  FosterApplication.submit({
    animalId: AnimalId.generate(),
    shelterId: ShelterId.generate(),
    applicantId: UserId.generate(),
    questionnaireVersion: 1,
    answers: [],
    plannedEndDate,
  });

describe("FosterApplication", () => {
  it("starts PENDING and keeps the planned end date", () => {
    const app = submit(new Date("2026-09-01"));
    expect(app.getStatus).toBe(FosterApplicationStatus.PENDING);
    expect(app.getPlannedEndDate).toEqual(new Date("2026-09-01"));
  });

  it("allows an indefinite (무기한) foster", () => {
    expect(submit(null).getPlannedEndDate).toBeNull();
  });

  it("is an active foster only once approved and not ended", () => {
    const app = submit();
    expect(app.isActiveFoster()).toBe(false);
    app.approve();
    expect(app.getStatus).toBe(FosterApplicationStatus.APPROVED);
    expect(app.isActiveFoster()).toBe(true);
  });

  it("terminates an active foster with a reason", () => {
    const app = submit();
    app.approve();
    const at = new Date("2026-08-01");
    app.terminate(FosterEndReason.EARLY_TERMINATED, at);
    expect(app.isActiveFoster()).toBe(false);
    expect(app.getEndedAt).toEqual(at);
    expect(app.getEndReason).toBe(FosterEndReason.EARLY_TERMINATED);
  });

  it("converts an active foster to adoption (successful end)", () => {
    const app = submit();
    app.approve();
    const at = new Date("2026-08-10");
    app.convertToAdoption(at);
    expect(app.isActiveFoster()).toBe(false);
    expect(app.getEndedAt).toEqual(at);
    expect(app.getEndReason).toBe(FosterEndReason.CONVERTED_TO_ADOPTION);
  });

  it("refuses to convert a foster that isn't active", () => {
    expect(() => submit().convertToAdoption(new Date())).toThrow("진행 중인");
  });

  it("refuses to terminate a foster that isn't active", () => {
    const pending = submit();
    expect(() =>
      pending.terminate(FosterEndReason.EXPIRED, new Date()),
    ).toThrow("진행 중인");

    const app = submit();
    app.approve();
    app.terminate(FosterEndReason.EXPIRED, new Date());
    expect(() => app.terminate(FosterEndReason.EXPIRED, new Date())).toThrow(
      "진행 중인",
    );
  });

  it("rejects and withdraws only while pending", () => {
    const rejected = submit();
    rejected.reject("사유");
    expect(rejected.getStatus).toBe(FosterApplicationStatus.REJECTED);
    expect(() => rejected.withdraw()).toThrow("이미 처리된");
  });
});
