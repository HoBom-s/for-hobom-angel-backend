import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { ChangeNicknameUseCase } from "src/hb-backend-api/user/domain/ports/in/change-nickname.use-case";
import { WithdrawAccountUseCase } from "src/hb-backend-api/user/domain/ports/in/withdraw-account.use-case";
import { SanctionUserUseCase } from "src/hb-backend-api/user/domain/ports/in/sanction-user.use-case";
import { ReinstateUserUseCase } from "src/hb-backend-api/user/domain/ports/in/reinstate-user.use-case";
import { ChangeNicknameDto } from "src/hb-backend-api/user/adapters/in/dto/change-nickname.dto";
import { SanctionUserDto } from "src/hb-backend-api/user/adapters/in/dto/sanction-user.dto";
import { MyProfileResponse } from "src/hb-backend-api/user/adapters/in/dto/my-profile.response";
import { PublicProfileResponse } from "src/hb-backend-api/user/adapters/in/dto/public-profile.response";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/users`)
export class UserController {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.ChangeNicknameUseCase)
    private readonly changeNicknameUseCase: ChangeNicknameUseCase,
    @Inject(DIToken.UserModule.WithdrawAccountUseCase)
    private readonly withdrawAccountUseCase: WithdrawAccountUseCase,
    @Inject(DIToken.UserModule.SanctionUserUseCase)
    private readonly sanctionUserUseCase: SanctionUserUseCase,
    @Inject(DIToken.UserModule.ReinstateUserUseCase)
    private readonly reinstateUserUseCase: ReinstateUserUseCase,
  ) {}

  @ApiOperation({ summary: "내 프로필 조회" })
  @ApiResponse({ type: MyProfileResponse })
  @Get("me")
  public async me(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyProfileResponse> {
    const me = await this.userQueryPort.findById(
      UserId.fromString(user.userId),
    );
    if (!me) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }
    return MyProfileResponse.from(me);
  }

  @ApiOperation({ summary: "닉네임 변경" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch("me/nickname")
  public async changeNickname(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangeNicknameDto,
  ): Promise<void> {
    await this.changeNicknameUseCase.invoke({
      userId: user.userId,
      nickname: body.nickname,
    });
  }

  @ApiOperation({ summary: "회원 탈퇴" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("me/withdrawal")
  public async withdraw(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.withdrawAccountUseCase.invoke({ userId: user.userId });
  }

  @ApiOperation({ summary: "계정 제재 (운영자)" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(":userId/sanction")
  public async sanction(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body() body: SanctionUserDto,
  ): Promise<void> {
    await this.sanctionUserUseCase.invoke({
      userId,
      actorId: user.userId,
      reason: body.reason,
    });
  }

  @ApiOperation({ summary: "계정 제재 해제 (운영자)" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(":userId/reinstatement")
  public async reinstate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
  ): Promise<void> {
    await this.reinstateUserUseCase.invoke({
      userId,
      actorId: user.userId,
    });
  }

  @ApiOperation({ summary: "공개 프로필 조회 (닉네임만)" })
  @ApiResponse({ type: PublicProfileResponse })
  @Get(":userId")
  public async publicProfile(
    @Param("userId") userId: string,
  ): Promise<PublicProfileResponse> {
    const user = await this.userQueryPort.findById(UserId.fromString(userId));
    if (!user) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }
    return PublicProfileResponse.from(user);
  }
}
