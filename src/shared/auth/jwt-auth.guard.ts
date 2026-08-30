import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "src/shared/auth/public.decorator";

/**
 * Requires a valid access token and populates `request.user` — except on routes
 * marked {@link Public}, which it lets through unauthenticated. This lets a
 * guarded controller expose a few open reads without dropping the guard from the
 * rest. Platform plumbing (no auth-domain dependency) so it lives in shared.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  public canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
