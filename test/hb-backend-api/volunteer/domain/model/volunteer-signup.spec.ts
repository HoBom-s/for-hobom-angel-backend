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
  it("starts ACTIVE and is owned by the volunteer", () => {
    const signup = submit();
    expect(signup.getStatus).toBe(VolunteerSignupStatus.ACTIVE);
    expect(signup.isActive()).toBe(true);
    expect(signup.isOwnedBy(volunteerId)).toBe(true);
    expect(signup.isOwnedBy(UserId.generate())).toBe(false);
  });

  it("withdraws once", () => {
    const signup = submit();
    signup.withdraw();
    expect(signup.getStatus).toBe(VolunteerSignupStatus.WITHDRAWN);
    expect(() => signup.withdraw()).toThrow("이미 철회");
  });
});
