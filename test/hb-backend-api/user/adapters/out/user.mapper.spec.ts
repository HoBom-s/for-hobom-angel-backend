import { Types } from "mongoose";
import { toDomain } from "src/hb-backend-api/user/adapters/out/user.mapper";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";

const doc = (over: Partial<UserEntity> = {}): UserEntity =>
  ({
    _id: new Types.ObjectId(),
    nickname: "hobom",
    email: "hobom@example.com",
    passwordHash: "hashed",
    verifiedChannel: VerifiedChannel.PHONE,
    roles: [UserRole.USER],
    shelterRoles: [],
    status: UserStatus.ACTIVE,
    withdrawnAt: null,
    purgeAfter: null,
    version: 0,
    ...over,
  }) as unknown as UserEntity;

describe("user.mapper toDomain", () => {
  it("maps a document into a User aggregate with VOs", () => {
    const user = toDomain(doc());
    expect(user.getNickname.raw).toBe("hobom");
    expect(user.getEmail.raw).toBe("hobom@example.com");
    expect(user.getRoles).toEqual([UserRole.USER]);
    expect(user.isActive()).toBe(true);
  });

  it("rehydrates shelter role grants", () => {
    const shelterId = new Types.ObjectId();
    const user = toDomain(
      doc({
        shelterRoles: [{ shelterId, role: UserRole.SHELTER_STAFF }],
      }),
    );
    expect(user.getShelterRoles).toHaveLength(1);
    expect(user.getShelterRoles[0].getRole).toBe(UserRole.SHELTER_STAFF);
  });

  it("carries the persisted version (defaults to 0)", () => {
    expect(toDomain(doc({ version: 7 })).getVersion).toBe(7);
    const noVersion = doc();
    delete (noVersion as { version?: number }).version;
    expect(toDomain(noVersion).getVersion).toBe(0);
  });
});
