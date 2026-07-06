import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/roles.guard";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

const fakeUser = (active: boolean, roles: UserRole[]) =>
  ({
    isActive: () => active,
    hasAnyRole: (req: UserRole[]) => req.some((r) => roles.includes(r)),
  }) as unknown as Awaited<ReturnType<UserQueryPort["findByNickname"]>>;

const ctxWith = (nickname?: string): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: nickname ? { nickname, userId: "u" } : undefined,
      }),
    }),
  }) as unknown as ExecutionContext;

const guardWith = (
  required: UserRole[] | undefined,
  queryPort: Partial<UserQueryPort>,
): RolesGuard =>
  new RolesGuard(
    { getAllAndOverride: () => required } as unknown as Reflector,
    queryPort as UserQueryPort,
  );

describe("RolesGuard", () => {
  it("allows when the route requires no roles", async () => {
    const guard = guardWith(undefined, { findByNickname: jest.fn() });
    await expect(guard.canActivate(ctxWith("n"))).resolves.toBe(true);
  });

  it("throws when the request is unauthenticated", async () => {
    const guard = guardWith([UserRole.SYSTEM_ADMIN], {
      findByNickname: jest.fn(),
    });
    await expect(guard.canActivate(ctxWith(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("throws when the user is unknown or inactive", async () => {
    const unknown = guardWith([UserRole.SYSTEM_ADMIN], {
      findByNickname: jest.fn().mockResolvedValue(null),
    });
    await expect(unknown.canActivate(ctxWith("n"))).rejects.toThrow(
      ForbiddenException,
    );

    const inactive = guardWith([UserRole.SYSTEM_ADMIN], {
      findByNickname: jest
        .fn()
        .mockResolvedValue(fakeUser(false, [UserRole.SYSTEM_ADMIN])),
    });
    await expect(inactive.canActivate(ctxWith("n"))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("denies insufficient roles and allows sufficient ones", async () => {
    const denied = guardWith([UserRole.SYSTEM_ADMIN], {
      findByNickname: jest
        .fn()
        .mockResolvedValue(fakeUser(true, [UserRole.USER])),
    });
    await expect(denied.canActivate(ctxWith("n"))).rejects.toThrow(
      ForbiddenException,
    );

    const allowed = guardWith([UserRole.SYSTEM_ADMIN], {
      findByNickname: jest
        .fn()
        .mockResolvedValue(fakeUser(true, [UserRole.SYSTEM_ADMIN])),
    });
    await expect(allowed.canActivate(ctxWith("n"))).resolves.toBe(true);
  });
});
