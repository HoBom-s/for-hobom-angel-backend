import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";
import { SignUpUseCase } from "src/hb-backend-api/auth/domain/ports/in/sign-up.use-case";
import { LoginUseCase } from "src/hb-backend-api/auth/domain/ports/in/login.use-case";
import { SignUpDto } from "src/hb-backend-api/auth/adapters/in/rest/dto/sign-up.dto";
import { LoginDto } from "src/hb-backend-api/auth/adapters/in/rest/dto/login.dto";
import { RefreshTokenDto } from "src/hb-backend-api/auth/adapters/in/rest/dto/refresh-token.dto";
import { SignUpResponse } from "src/hb-backend-api/auth/adapters/in/rest/dto/sign-up.response";
import { TokenPairResponse } from "src/hb-backend-api/auth/adapters/in/rest/dto/token-pair.response";

/**
 * Session entry points. All are unauthenticated (they mint or rotate the very
 * tokens the guard would require). Signup/login exchange email+password for a
 * token pair; refresh rotates with reuse detection; logout revokes the family.
 */
@ApiTags("Auth")
@Controller(`${EndPointPrefixConstant}/auth`)
export class AuthController {
  constructor(
    @Inject(DIToken.AuthModule.SignUpUseCase)
    private readonly signUpUseCase: SignUpUseCase,
    @Inject(DIToken.AuthModule.LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @ApiOperation({ summary: "회원가입 (이메일+비밀번호 + 세션 발급)" })
  @ApiResponse({ type: SignUpResponse })
  @Post("signup")
  public async signup(@Body() body: SignUpDto): Promise<SignUpResponse> {
    const result = await this.signUpUseCase.invoke({
      email: body.email,
      password: body.password,
      nickname: body.nickname,
      realName: body.realName,
      phone: body.phone,
    });
    return SignUpResponse.from(result);
  }

  @ApiOperation({ summary: "로그인 (이메일+비밀번호)" })
  @ApiResponse({ type: TokenPairResponse })
  @Post("login")
  public async login(@Body() body: LoginDto): Promise<TokenPairResponse> {
    const tokens = await this.loginUseCase.invoke({
      email: body.email,
      password: body.password,
    });
    return TokenPairResponse.from(tokens);
  }

  @ApiOperation({ summary: "토큰 재발급 (회전 + 재사용 탐지)" })
  @ApiResponse({ type: TokenPairResponse })
  @Post("refresh")
  public async refresh(
    @Body() body: RefreshTokenDto,
  ): Promise<TokenPairResponse> {
    const tokens = await this.refreshTokenService.rotate(body.refreshToken);
    return TokenPairResponse.from(tokens);
  }

  @ApiOperation({ summary: "로그아웃 (토큰 패밀리 폐기)" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  public async logout(@Body() body: RefreshTokenDto): Promise<void> {
    await this.refreshTokenService.revoke(body.refreshToken);
  }
}
