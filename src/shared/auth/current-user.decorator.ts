import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";

/** Injects the authenticated principal set by the JWT strategy. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedUser;
  },
);
