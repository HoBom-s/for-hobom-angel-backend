import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";

const volunteerId = UserId.generate();

const submit = () =>
  VolunteerSignup.submit({
    eventId: VolunteerEventId.generate(),
    volunteerId,
  });

describe("VolunteerSignup", () => {
  it("starts PENDING (live) and is owned by the volunteer", () => {
    const signup = submit();
    expect(signup.getStatus).toBe(VolunteerSignupStatus.PENDING);
    expect(signup.isLive()).toBe(true);
    expect(signup.isOwnedBy(volunteerId)).toBe(true);
    expect(signup.isOwnedBy(UserId.generate())).toBe(false);
  });

  describe("staff decision", () => {
    it("approves a pending signup (stays live)", () => {
      const signup = submit();
      signup.approve();
      expect(signup.getStatus).toBe(VolunteerSignupStatus.APPROVED);
      expect(signup.isLive()).toBe(true);
    });

    it("rejects a pending signup (no longer live)", () => {
      const signup = submit();
      signup.reject();
      expect(signup.getStatus).toBe(VolunteerSignupStatus.REJECTED);
      expect(signup.isLive()).toBe(false);
    });

    it("cannot decide a non-pending signup", () => {
      const approved = submit();
      approved.approve();
      expect(() => approved.approve()).toThrow("승인");
      expect(() => approved.reject()).toThrow("거절");
    });
  });

  describe("withdraw", () => {
    it("withdraws from PENDING", () => {
      const signup = submit();
      signup.withdraw();
      expect(signup.getStatus).toBe(VolunteerSignupStatus.WITHDRAWN);
    });

    it("withdraws from APPROVED, but not after a terminal state", () => {
      const signup = submit();
      signup.approve();
      signup.withdraw();
      expect(signup.getStatus).toBe(VolunteerSignupStatus.WITHDRAWN);
      expect(() => signup.withdraw()).toThrow("이미 처리");
    });
  });
});
