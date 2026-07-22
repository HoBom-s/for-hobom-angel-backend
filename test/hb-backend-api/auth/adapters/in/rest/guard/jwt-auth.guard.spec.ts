import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "src/hb-backend-api/auth/adapters/in/rest/decorator/public.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";

const handler = () => undefined;
const klass = class {};
const context = {
  getHandler: () => handler,
  getClass: () => klass,
} as unknown as ExecutionContext;

describe("JwtAuthGuard", () => {
  it("lets a @Public route through without authenticating", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
    // Consulted route handler first, then the controller class.
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      handler,
      klass,
    ]);
  });

  it("delegates to passport when the route is not public", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);

    // Passport's AuthGuard base runs its jwt strategy; stub it so this stays a
    // unit test. The point is that a non-public route does NOT short-circuit.
    const superCanActivate = jest
      .spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype) as {
          canActivate: (c: ExecutionContext) => boolean;
        },
        "canActivate",
      )
      .mockReturnValue(false);

    expect(guard.canActivate(context)).toBe(false);
    expect(superCanActivate).toHaveBeenCalledWith(context);

    superCanActivate.mockRestore();
  });
});
