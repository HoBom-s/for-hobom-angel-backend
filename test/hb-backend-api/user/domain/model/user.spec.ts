import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";
import { ShelterRoleGrant } from "src/hb-backend-api/user/domain/model/shelter-role-grant";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { Ci } from "src/hb-backend-api/user/domain/model/vo/ci.vo";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

const registration = (roles?: UserRole[]) =>
  RegisterUser.of({
    nickname: "hobom",
    realName: "홍길동",
    ci: "ci-value",
    phone: "01012345678",
    email: "hobom@example.com",
    verifiedChannel: VerifiedChannel.PHONE,
    roles,
  });

const shelter = () => new ShelterId(new Types.ObjectId());

const reconstitute = (
  overrides: Partial<Parameters<typeof User.reconstitute>[0]> = {},
) =>
  User.reconstitute({
    id: UserId.generate(),
    nickname: Nickname.of("hobom"),
    email: Email.of("hobom@example.com"),
    ci: Ci.of("ci-value"),
    verifiedChannel: VerifiedChannel.PHONE,
    roles: [UserRole.USER],
    shelterRoles: [],
    status: UserStatus.ACTIVE,
    withdrawnAt: null,
    purgeAfter: null,
    ...overrides,
  });

describe("User aggregate", () => {
  describe("register", () => {
    it("creates an active user with the USER role", () => {
      const user = User.register(registration());
      expect(user.isActive()).toBe(true);
      expect(user.getRoles).toContain(UserRole.USER);
      expect(user.getStatus).toBe(UserStatus.ACTIVE);
      expect(user.getShelterRoles).toEqual([]);
    });

    it("always includes USER even if omitted", () => {
      const user = User.register(registration([UserRole.SYSTEM_ADMIN]));
      expect(user.getRoles).toEqual(
        expect.arrayContaining([UserRole.USER, UserRole.SYSTEM_ADMIN]),
      );
    });
  });

  describe("authorization", () => {
    it("isPlatformAdmin reflects SYSTEM_ADMIN", () => {
      expect(reconstitute({ roles: [UserRole.USER] }).isPlatformAdmin()).toBe(
        false,
      );
      expect(
        reconstitute({
          roles: [UserRole.USER, UserRole.SYSTEM_ADMIN],
        }).isPlatformAdmin(),
      ).toBe(true);
    });

    it("hasAnyRole checks platform roles and shelter grants", () => {
      const s = shelter();
      const user = reconstitute({
        roles: [UserRole.USER],
        shelterRoles: [ShelterRoleGrant.of(s, UserRole.SHELTER_STAFF)],
      });
      expect(user.hasAnyRole([UserRole.SHELTER_STAFF])).toBe(true);
      expect(user.hasAnyRole([UserRole.SYSTEM_ADMIN])).toBe(false);
      expect(user.hasAnyRole([UserRole.USER])).toBe(true);
    });

    it("hasShelterRole is scoped, but platform admin overrides", () => {
      const s = shelter();
      const staff = reconstitute({
        shelterRoles: [ShelterRoleGrant.of(s, UserRole.SHELTER_STAFF)],
      });
      expect(staff.hasShelterRole(s, UserRole.SHELTER_STAFF)).toBe(true);
      expect(staff.hasShelterRole(shelter(), UserRole.SHELTER_STAFF)).toBe(
        false,
      );

      const admin = reconstitute({
        roles: [UserRole.USER, UserRole.SYSTEM_ADMIN],
      });
      expect(admin.hasShelterRole(shelter(), UserRole.SHELTER_ADMIN)).toBe(
        true,
      );
    });

    it("toTenantScope reflects shelter grants (admin is unscoped)", () => {
      const s = shelter();
      const scope = reconstitute({
        shelterRoles: [ShelterRoleGrant.of(s, UserRole.SHELTER_STAFF)],
      }).toTenantScope();
      expect(scope.isPlatformAdmin).toBe(false);
      expect(scope.canAccess(s.toString())).toBe(true);
      expect(scope.canAccess(shelter().toString())).toBe(false);

      expect(
        reconstitute({
          roles: [UserRole.USER, UserRole.SYSTEM_ADMIN],
        }).toTenantScope().isPlatformAdmin,
      ).toBe(true);
    });
  });

  describe("state transitions", () => {
    it("promoteToShelterStaff adds a scoped grant", () => {
      const s = shelter();
      const user = User.register(registration());
      user.promoteToShelterStaff(s);
      expect(user.hasShelterRole(s, UserRole.SHELTER_STAFF)).toBe(true);
    });

    it("promoteToShelterStaff rejects duplicates", () => {
      const s = shelter();
      const user = User.register(registration());
      user.promoteToShelterStaff(s);
      expect(() => user.promoteToShelterStaff(s)).toThrow();
    });

    it("promoteToShelterStaff rejects when withdrawn", () => {
      const user = reconstitute({ status: UserStatus.WITHDRAWN });
      expect(() => user.promoteToShelterStaff(shelter())).toThrow();
    });

    it("grantShelterAdmin adds an admin grant and rejects duplicates", () => {
      const s = shelter();
      const user = User.register(registration());
      user.grantShelterAdmin(s);
      expect(user.hasShelterRole(s, UserRole.SHELTER_ADMIN)).toBe(true);
      expect(() => user.grantShelterAdmin(s)).toThrow();
    });

    it("withdraw flips status and stamps timestamps", () => {
      const user = User.register(registration());
      const at = new Date("2026-07-06T00:00:00Z");
      const purge = new Date("2026-08-06T00:00:00Z");
      user.withdraw(at, purge);
      expect(user.getStatus).toBe(UserStatus.WITHDRAWN);
      expect(user.getWithdrawnAt).toEqual(at);
      expect(user.getPurgeAfter).toEqual(purge);
      expect(user.isActive()).toBe(false);
    });

    it("withdraw twice is rejected", () => {
      const user = User.register(registration());
      user.withdraw(new Date(), new Date());
      expect(() => user.withdraw(new Date(), new Date())).toThrow();
    });
  });

  it("getRoles / getShelterRoles return defensive copies", () => {
    const user = User.register(registration());
    user.getRoles.push(UserRole.SYSTEM_ADMIN);
    user.getShelterRoles.push(
      ShelterRoleGrant.of(shelter(), UserRole.SHELTER_STAFF),
    );
    expect(user.getRoles).not.toContain(UserRole.SYSTEM_ADMIN);
    expect(user.getShelterRoles).toEqual([]);
  });
});
