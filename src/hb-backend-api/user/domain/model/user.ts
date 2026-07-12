import { TenantScope } from "src/shared/tenant/tenant-scope";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";
import { ShelterRoleGrant } from "src/hb-backend-api/user/domain/model/shelter-role-grant";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/**
 * User aggregate — the consistency boundary for identity, authorization and
 * account lifecycle. Invariants and state transitions live HERE as methods
 * that enforce and throw; services only orchestrate. Plaintext PII (real name,
 * phone) is deliberately NOT part of this aggregate — revealing it is a
 * separate, audited operation.
 *
 * Construction paths:
 *  - {@link User.register} — brand-new member (from a validated RegisterUser).
 *  - {@link User.reconstitute} — rehydrate from persistence (mapper only).
 */
export class User {
  private constructor(
    private readonly id: UserId,
    private nickname: Nickname,
    private readonly email: Email,
    private readonly passwordHash: string,
    private readonly verifiedChannel: VerifiedChannel,
    private readonly roles: UserRole[],
    private readonly shelterRoles: ShelterRoleGrant[],
    private status: UserStatus,
    private withdrawnAt: Date | null,
    private purgeAfter: Date | null,
    private readonly version: number,
  ) {}

  public static register(registration: RegisterUser): User {
    const roles = registration.getRoles;
    if (!roles.includes(UserRole.USER)) {
      roles.push(UserRole.USER);
    }
    return new User(
      UserId.generate(),
      registration.getNickname,
      registration.getEmail,
      registration.getPasswordHash,
      registration.getVerifiedChannel,
      roles,
      [],
      UserStatus.ACTIVE,
      null,
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: UserId;
    nickname: Nickname;
    email: Email;
    passwordHash: string;
    verifiedChannel: VerifiedChannel;
    roles: UserRole[];
    shelterRoles: ShelterRoleGrant[];
    status: UserStatus;
    withdrawnAt: Date | null;
    purgeAfter: Date | null;
    version: number;
  }): User {
    return new User(
      params.id,
      params.nickname,
      params.email,
      params.passwordHash,
      params.verifiedChannel,
      params.roles,
      params.shelterRoles,
      params.status,
      params.withdrawnAt,
      params.purgeAfter,
      params.version,
    );
  }

  // ── authorization ───────────────────────────────────────────────
  public isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  public isPlatformAdmin(): boolean {
    return this.roles.includes(UserRole.SYSTEM_ADMIN);
  }

  /** Coarse RBAC gate: role held at platform level OR via any shelter grant. */
  public hasAnyRole(required: UserRole[]): boolean {
    return required.some(
      (role) =>
        this.roles.includes(role) ||
        this.shelterRoles.some((grant) => grant.getRole === role),
    );
  }

  public hasShelterRole(shelterId: ShelterId, role: UserRole): boolean {
    return (
      this.isPlatformAdmin() ||
      this.shelterRoles.some((grant) => grant.matches(shelterId, role))
    );
  }

  /** Whether this member may manage a shelter's content (its staff or admin). */
  public canManageShelter(shelterId: ShelterId): boolean {
    return (
      this.hasShelterRole(shelterId, UserRole.SHELTER_STAFF) ||
      this.hasShelterRole(shelterId, UserRole.SHELTER_ADMIN)
    );
  }

  /** The tenant boundary this user may act within (see {@link TenantScope}). */
  public toTenantScope(): TenantScope {
    return TenantScope.of(
      this.isPlatformAdmin(),
      this.shelterRoles.map((grant) => grant.getShelterId.toString()),
    );
  }

  // ── state transitions (invariant-enforcing) ─────────────────────
  public promoteToShelterStaff(shelterId: ShelterId): void {
    this.assertActive();
    if (
      this.shelterRoles.some((grant) =>
        grant.matches(shelterId, UserRole.SHELTER_STAFF),
      )
    ) {
      throw new Error("이미 해당 보호소의 스태프예요.");
    }
    this.shelterRoles.push(
      ShelterRoleGrant.of(shelterId, UserRole.SHELTER_STAFF),
    );
  }

  public grantShelterAdmin(shelterId: ShelterId): void {
    this.assertActive();
    if (
      this.shelterRoles.some((grant) =>
        grant.matches(shelterId, UserRole.SHELTER_ADMIN),
      )
    ) {
      throw new Error("이미 해당 보호소의 관리자예요.");
    }
    this.shelterRoles.push(
      ShelterRoleGrant.of(shelterId, UserRole.SHELTER_ADMIN),
    );
  }

  /** Rename the public display name. Uniqueness is enforced by the service + index. */
  public changeNickname(nickname: Nickname): void {
    this.assertActive();
    this.nickname = nickname;
  }

  /** Soft-withdraw. `at` = now, `purgeAfter` = end of the deletion grace period. */
  public withdraw(at: Date, purgeAfter: Date): void {
    this.assertActive();
    this.status = UserStatus.WITHDRAWN;
    this.withdrawnAt = at;
    this.purgeAfter = purgeAfter;
  }

  private assertActive(): void {
    if (!this.isActive()) {
      throw new Error("활성 상태의 회원만 처리할 수 있어요.");
    }
  }

  // ── accessors (for mappers / read models) ───────────────────────
  public get getId(): UserId {
    return this.id;
  }
  public get getNickname(): Nickname {
    return this.nickname;
  }
  public get getEmail(): Email {
    return this.email;
  }
  public get getPasswordHash(): string {
    return this.passwordHash;
  }
  public get getVerifiedChannel(): VerifiedChannel {
    return this.verifiedChannel;
  }
  public get getRoles(): UserRole[] {
    return [...this.roles];
  }
  public get getShelterRoles(): ShelterRoleGrant[] {
    return [...this.shelterRoles];
  }
  public get getStatus(): UserStatus {
    return this.status;
  }
  public get getWithdrawnAt(): Date | null {
    return this.withdrawnAt;
  }
  public get getPurgeAfter(): Date | null {
    return this.purgeAfter;
  }
  /** Loaded version, used as the optimistic-lock guard on the next save. */
  public get getVersion(): number {
    return this.version;
  }
}
