import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";

export const ROLES_KEY = "roles";

/**
 * Restricts a route to the given platform roles. Enforced by {@link RolesGuard},
 * which must run after {@link JwtAuthGuard}:
 *
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(UserRole.SHELTER_ADMIN, UserRole.SYSTEM_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
