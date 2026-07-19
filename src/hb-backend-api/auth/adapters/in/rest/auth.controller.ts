import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ThrottleConfig } from "src/shared/throttle/throttle.config";
import { ApiCreatedEnvelope } from "src/shared/response/api-envelope.decorator";
import { Request, Response } from "express";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";
import { SignUpUseCase } from "src/hb-backend-api/auth/domain/ports/in/sign-up.use-case";
import { LoginUseCase } from "src/hb-backend-api/auth/domain/ports/in/login.use-case";
import {
  AuthCookieService,
  REFRESH_COOKIE,
} from "src/hb-backend-api/auth/adapters/in/rest/auth-cookie.service";
import { SignUpDto } from "src/hb-backend-api/auth/adapters/in/rest/dto/sign-up.dto";
import { LoginDto } from "src/hb-backend-api/auth/adapters/in/rest/dto/login.dto";
import { RefreshTokenDto } from "src/hb-backend-api/auth/adapters/in/rest/dto/refresh-token.dto";
import { SessionResponse } from "src/hb-backend-api/auth/adapters/in/rest/dto/session.response";

/**
 * Session entry points. All are unauthenticated (they mint or rotate the very
 * tokens the guard would require). Tokens are delivered as httpOnly cookies —
 * never in the response body — so JavaScript (and any XSS) can't read them; the
 * body carries only `userId`. Signup/login open a session, refresh rotates with
 * reuse detection, logout revokes the family and clears the cookies.
 */
// Tighter than the global default: signup/login are the brute-force targets, so
// cap auth attempts per client IP (see ThrottleConfig.authLimit).
@Throttle({
  default: { limit: ThrottleConfig.authLimit, ttl: ThrottleConfig.windowMs },
})
@ApiTags("Auth")
@Controller(`${EndPointPrefixConstant}/auth`)
export class AuthController {
  constructor(
    @Inject(DIToken.AuthModule.SignUpUseCase)
    private readonly signUpUseCase: SignUpUseCase,
    @Inject(DIToken.AuthModule.LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @ApiOperation({ summary: "회원가입 (이메일+비밀번호 + 세션 쿠키 발급)" })
  @ApiCreatedEnvelope(SessionResponse)
  @Post("signup")
  public async signup(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    const result = await this.signUpUseCase.invoke({
      email: body.email,
      password: body.password,
      nickname: body.nickname,
      realName: body.realName,
      phone: body.phone,
    });
    this.authCookieService.set(res, result.tokens);
    return SessionResponse.of(result.userId);
  }

  @ApiOperation({ summary: "로그인 (이메일+비밀번호 + 세션 쿠키 발급)" })
  @ApiCreatedEnvelope(SessionResponse)
  @Post("login")
  public async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    const result = await this.loginUseCase.invoke({
      email: body.email,
      password: body.password,
    });
    this.authCookieService.set(res, result.tokens);
    return SessionResponse.of(result.userId);
  }

  @ApiOperation({ summary: "토큰 재발급 (쿠키의 refresh 회전 + 재사용 탐지)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("refresh")
  public async refresh(
    @Req() req: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const presented = this.readRefreshToken(req, body);
    const tokens = await this.refreshTokenService.rotate(presented);
    this.authCookieService.set(res, tokens);
  }

  @ApiOperation({ summary: "로그아웃 (토큰 패밀리 폐기 + 쿠키 삭제)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  public async logout(
    @Req() req: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const presented = this.cookieOrBody(req, body);
    if (presented) {
      await this.refreshTokenService.revoke(presented);
    }
    this.authCookieService.clear(res);
  }

  private cookieOrBody(
    req: Request,
    body: RefreshTokenDto | undefined,
  ): string | undefined {
    // Guests hit /auth/refresh with no cookie and (often) no body at all — read
    // both defensively so a missing token is a clean 401, never a 500.
    return (
      (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE] ??
      body?.refreshToken
    );
  }

  private readRefreshToken(
    req: Request,
    body: RefreshTokenDto | undefined,
  ): string {
    const token = this.cookieOrBody(req, body);
    if (!token) {
      throw new UnauthorizedException("refresh token이 없어요.");
    }
    return token;
  }
}
