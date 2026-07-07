import { UnauthorizedException } from "@nestjs/common";

/** Refresh failed — token unknown, revoked, expired, or reused. */
export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super("유효하지 않은 리프레시 토큰이에요. 다시 로그인해 주세요.");
  }
}
