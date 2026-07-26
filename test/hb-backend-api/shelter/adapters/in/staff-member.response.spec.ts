import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { ShelterRoleGrant } from "src/hb-backend-api/user/domain/model/shelter-role-grant";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { StaffMemberResponse } from "src/hb-backend-api/shelter/adapters/in/dto/staff-member.response";

const shelterA = ShelterId.generate();
const shelterB = ShelterId.generate();

const userWithGrants = (grants: ShelterRoleGrant[]): User =>
  User.reconstitute({
    id: UserId.generate(),
    nickname: Nickname.of("roster-kim"),
    email: Email.of("kim@test.local"),
    passwordHash: "hash",
    verifiedChannel: VerifiedChannel.EMAIL,
    roles: [UserRole.USER],
    shelterRoles: grants,
    status: UserStatus.ACTIVE,
    withdrawnAt: null,
    purgeAfter: null,
    suspendedAt: null,
    sanctionReason: null,
    version: 0,
    createdAt: null,
  });

describe("StaffMemberResponse.from", () => {
  it("projects id, nickname and status", () => {
    const user = userWithGrants([
      ShelterRoleGrant.of(shelterA, UserRole.SHELTER_STAFF),
    ]);
    const dto = StaffMemberResponse.from(user, shelterA);

    expect(dto.id).toBe(user.getId.toString());
    expect(dto.nickname).toBe("roster-kim");
    expect(dto.status).toBe(UserStatus.ACTIVE);
  });

  it("includes only the roles held at THIS shelter", () => {
    const user = userWithGrants([
      ShelterRoleGrant.of(shelterA, UserRole.SHELTER_STAFF),
      ShelterRoleGrant.of(shelterB, UserRole.SHELTER_ADMIN),
    ]);

    expect(StaffMemberResponse.from(user, shelterA).roles).toEqual([
      UserRole.SHELTER_STAFF,
    ]);
    expect(StaffMemberResponse.from(user, shelterB).roles).toEqual([
      UserRole.SHELTER_ADMIN,
    ]);
  });
});
