import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

const submit = () =>
  AdoptionApplication.submit({
    animalId: AnimalId.generate(),
    shelterId: ShelterId.generate(),
    applicantId: UserId.generate(),
    questionnaireVersion: 1,
    answers: [],
  });

describe("AdoptionApplication", () => {
  it("starts PENDING", () => {
    expect(submit().getStatus).toBe(AdoptionApplicationStatus.PENDING);
  });

  it("approves a pending application", () => {
    const app = submit();
    app.approve();
    expect(app.getStatus).toBe(AdoptionApplicationStatus.APPROVED);
  });

  it("rejects with a reason", () => {
    const app = submit();
    app.reject("조건 불충족");
    expect(app.getStatus).toBe(AdoptionApplicationStatus.REJECTED);
    expect(app.getDecidedReason).toBe("조건 불충족");
  });

  it("requires a reason to reject", () => {
    expect(() => submit().reject("  ")).toThrow("사유");
  });

  it("withdraws a pending application", () => {
    const app = submit();
    app.withdraw();
    expect(app.getStatus).toBe(AdoptionApplicationStatus.WITHDRAWN);
  });

  it("refuses a second decision", () => {
    const app = submit();
    app.approve();
    expect(() => app.reject("too late")).toThrow("이미 처리된");
    expect(() => app.withdraw()).toThrow("이미 처리된");
  });
});
