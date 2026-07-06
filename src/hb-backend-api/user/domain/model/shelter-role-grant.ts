import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";

/**
 * A shelter-scoped role grant on a user aggregate: "user holds `role` at
 * `shelterId`". Only SHELTER_STAFF / SHELTER_ADMIN are valid here; platform
 * roles (USER, SYSTEM_ADMIN) live in the aggregate's platform-role list.
 */
export class ShelterRoleGrant {
  private static readonly ALLOWED = new Set<UserRole>([
    UserRole.SHELTER_STAFF,
    UserRole.SHELTER_ADMIN,
  ]);

  constructor(
    private readonly shelterId: ShelterId,
    private readonly role: UserRole,
  ) {
    if (!ShelterRoleGrant.ALLOWED.has(role)) {
      throw new Error(`보호소 스코프 역할이 아니에요. ${role}`);
    }
    Object.freeze(this);
  }

  public static of(shelterId: ShelterId, role: UserRole): ShelterRoleGrant {
    return new ShelterRoleGrant(shelterId, role);
  }

  public isFor(shelterId: ShelterId): boolean {
    return this.shelterId.equals(shelterId);
  }

  public matches(shelterId: ShelterId, role: UserRole): boolean {
    return this.shelterId.equals(shelterId) && this.role === role;
  }

  public get getShelterId(): ShelterId {
    return this.shelterId;
  }

  public get getRole(): UserRole {
    return this.role;
  }
}
