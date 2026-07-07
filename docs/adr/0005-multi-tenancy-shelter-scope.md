# ADR-0005: Multi-tenancy via `shelterId` + TenantScope

- Status: Accepted
- Date: 2026-07-07

## Context

Each shelter is a tenant: its animals, notices, volunteering, and applicants are
its own. The classic multi-tenant failure is a cross-tenant data leak — one
handler that forgets to constrain a query by tenant and returns another
shelter's data. Relying on per-handler discipline is not enough.

## Decision

Single database with a `shelterId` partition on tenant-scoped collections
(shared schema). Enforcement is a reusable primitive, **`TenantScope`**, not
developer discipline:

- Built from a user (`user.toTenantScope()`): the shelters they may act within,
  or unscoped for a platform admin.
- Single resource: `scope.assertAccess(shelterId)` before returning.
- Lists: merge `scope.mongoFilter()` into the query so results are constrained
  at the database.

Shelter-scoped roles (SHELTER_STAFF/ADMIN) are limited to a `shelterId`;
platform roles (USER, SYSTEM_ADMIN) are unscoped.

## Consequences

- Cross-tenant access is blocked at the query layer, uniformly.
- Every tenant-scoped collection needs a `shelterId` index and must apply the
  scope; code review / the repository layer should make this the default.
- Cross-tenant reporting for operators goes through the platform-admin (unscoped)
  path deliberately.
