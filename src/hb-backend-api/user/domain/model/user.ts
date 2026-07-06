import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";
import { ShelterRoleGrant } from "src/hb-backend-api/user/domain/model/shelter-role-grant";
import { Ci } from "src/hb-backend-api/user/domain/model/vo/ci.vo";
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
    private readonly nickname: Nickname,
    private readonly email: Email,
    private readonly ci: Ci,
    private readonly verifiedChannel: VerifiedChannel,
    private readonly roles: UserRole[],
    private readonly shelterRoles: ShelterRoleGrant[],
    private status: UserStatus,
    private withdrawnAt: Date | null,
    private purgeAfter: Date | null,
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
      registration.getCi,
      registration.getVerifiedChannel,
      roles,
      [],
      UserStatus.ACTIVE,
      null,
      null,
    );
  }

  public static reconstitute(params: {
    id: UserId;
    nickname: Nickname;
    email: Email;
    ci: Ci;
    verifiedChannel: VerifiedChannel;
    roles: UserRole[];
    shelterRoles: ShelterRoleGrant[];
    status: UserStatus;
    withdrawnAt: Date | null;
    purgeAfter: Date | null;
  }): User {
    return new User(
      params.id,
      params.nickname,
      params.email,
      params.ci,
      params.verifiedChannel,
      params.roles,
      params.shelterRoles,
      params.status,
      params.withdrawnAt,
      params.purgeAfter,
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
  public get getCi(): Ci {
    return this.ci;
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
}
