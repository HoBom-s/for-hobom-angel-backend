import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { ShelterRoleGrant } from "src/hb-backend-api/user/domain/model/shelter-role-grant";

const shelter = () => new ShelterId(new Types.ObjectId());

describe("ShelterRoleGrant", () => {
  it("allows shelter-scoped roles", () => {
    const s = shelter();
    expect(ShelterRoleGrant.of(s, UserRole.SHELTER_STAFF).getRole).toBe(
      UserRole.SHELTER_STAFF,
    );
    expect(ShelterRoleGrant.of(s, UserRole.SHELTER_ADMIN).getRole).toBe(
      UserRole.SHELTER_ADMIN,
    );
  });

  it.each([UserRole.USER, UserRole.SYSTEM_ADMIN])(
    "rejects platform role %s",
    (role) => {
      expect(() => ShelterRoleGrant.of(shelter(), role)).toThrow();
    },
  );

  it("matches on shelter + role", () => {
    const s = shelter();
    const grant = ShelterRoleGrant.of(s, UserRole.SHELTER_STAFF);
    expect(grant.matches(s, UserRole.SHELTER_STAFF)).toBe(true);
    expect(grant.matches(s, UserRole.SHELTER_ADMIN)).toBe(false);
    expect(grant.matches(shelter(), UserRole.SHELTER_STAFF)).toBe(false);
    expect(grant.isFor(s)).toBe(true);
  });
});
