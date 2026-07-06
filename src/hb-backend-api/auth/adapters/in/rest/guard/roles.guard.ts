import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { DIToken } from "src/shared/di/token.di";
import { ROLES_KEY } from "src/hb-backend-api/auth/adapters/in/rest/decorator/roles.decorator";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Authorizes by platform role. Loads the current user's roles/status from the
 * store (not the token) so privilege changes take effect immediately rather than
 * lingering until token refresh. Only role-restricted routes pay this lookup.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const principal = request.user as AuthenticatedUser | undefined;
    if (!principal) {
      throw new ForbiddenException("Not authenticated");
    }

    const user = await this.userQueryPort.findByNickname(principal.nickname);
    if (!user || !user.isActive()) {
      throw new ForbiddenException("Inactive or unknown user");
    }
    if (!user.hasAnyRole(required)) {
      throw new ForbiddenException("Insufficient role");
    }
    return true;
  }
}
