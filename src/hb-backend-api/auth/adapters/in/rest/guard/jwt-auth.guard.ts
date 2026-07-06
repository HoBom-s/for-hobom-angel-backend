import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Requires a valid access token. Populates `request.user`. */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
