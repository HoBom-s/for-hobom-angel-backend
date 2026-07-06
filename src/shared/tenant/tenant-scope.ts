import { ForbiddenException } from "@nestjs/common";

/**
 * The set of shelters an actor may touch. Turns "which shelters is this user
 * scoped to" into an enforceable primitive so cross-tenant access is blocked at
 * the query layer, not left to per-handler discipline (the classic multi-tenant
 * data-leak). A platform admin is unscoped.
 *
 * Domain repositories enforce it two ways:
 *   - single-resource: `scope.assertAccess(animal.shelterId)` before returning
 *   - list/query:      merge `scope.mongoFilter()` into the Mongo filter
 *
 * Kept primitive (string ids) so the shared kernel stays free of feature-module
 * imports; build one from a User via `user.toTenantScope()`.
 */
export class TenantScope {
  private constructor(
    private readonly platformAdmin: boolean,
    private readonly shelterIds: ReadonlySet<string>,
  ) {}

  public static of(platformAdmin: boolean, shelterIds: string[]): TenantScope {
    return new TenantScope(platformAdmin, new Set(shelterIds));
  }

  /** Unscoped access — platform operators only. */
  public static platform(): TenantScope {
    return new TenantScope(true, new Set());
  }

  public canAccess(shelterId: string): boolean {
    return this.platformAdmin || this.shelterIds.has(shelterId);
  }

  public assertAccess(shelterId: string): void {
    if (!this.canAccess(shelterId)) {
      throw new ForbiddenException("이 보호소 리소스에 접근할 수 없어요.");
    }
  }

  /**
   * Mongo filter fragment that constrains a query to the accessible shelters.
   * Empty (`{}`) for a platform admin. A non-admin with no shelters gets
   * `{ field: { $in: [] } }`, which correctly matches nothing.
   */
  public mongoFilter(field = "shelterId"): Record<string, unknown> {
    if (this.platformAdmin) {
      return {};
    }
    return { [field]: { $in: [...this.shelterIds] } };
  }

  public get isPlatformAdmin(): boolean {
    return this.platformAdmin;
  }

  public get accessibleShelterIds(): string[] {
    return [...this.shelterIds];
  }
}
