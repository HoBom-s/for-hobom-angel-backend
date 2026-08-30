import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseEnumPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiCreatedEnvelope,
  ApiEnvelopeArray,
} from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/shared/auth/current-user.decorator";
import { JwtAuthGuard } from "src/shared/auth/jwt-auth.guard";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { GrantConsentUseCase } from "src/hb-backend-api/consent/domain/ports/in/grant-consent.use-case";
import { WithdrawConsentUseCase } from "src/hb-backend-api/consent/domain/ports/in/withdraw-consent.use-case";
import { ListMyConsentsUseCase } from "src/hb-backend-api/consent/domain/ports/in/list-my-consents.use-case";
import { GrantConsentDto } from "src/hb-backend-api/consent/adapters/in/dto/grant-consent.dto";
import {
  ConsentResponse,
  ConsentStatusResponse,
} from "src/hb-backend-api/consent/adapters/in/dto/consent.response";

/**
 * Self-service consent — the caller acts on their own consents (no operator
 * role). Each grant/withdraw is recorded in the audit trail (CONSENT_GIVEN /
 * CONSENT_WITHDRAWN); consent binds to the exact policy version presented.
 */
@ApiTags("Consent")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class ConsentController {
  constructor(
    @Inject(DIToken.ConsentModule.GrantConsentUseCase)
    private readonly grantConsentUseCase: GrantConsentUseCase,
    @Inject(DIToken.ConsentModule.WithdrawConsentUseCase)
    private readonly withdrawConsentUseCase: WithdrawConsentUseCase,
    @Inject(DIToken.ConsentModule.ListMyConsentsUseCase)
    private readonly listMyConsentsUseCase: ListMyConsentsUseCase,
  ) {}

  @ApiOperation({ summary: "정책 동의 (현재 버전)" })
  @ApiCreatedEnvelope(ConsentResponse)
  @Post("me/consents")
  public async grant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GrantConsentDto,
  ): Promise<ConsentResponse> {
    const consent = await this.grantConsentUseCase.invoke({
      userId: user.userId,
      policyType: body.policyType,
      policyVersion: body.policyVersion,
    });
    return ConsentResponse.from(consent);
  }

  @ApiOperation({ summary: "정책 동의 철회" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("me/consents/:policyType/withdrawal")
  public async withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param("policyType", new ParseEnumPipe(PolicyType)) policyType: PolicyType,
  ): Promise<void> {
    await this.withdrawConsentUseCase.invoke({
      userId: user.userId,
      policyType,
    });
  }

  @ApiOperation({ summary: "내 동의 현황 (재동의 필요 여부 포함)" })
  @ApiEnvelopeArray(ConsentStatusResponse)
  @Get("me/consents")
  public async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConsentStatusResponse[]> {
    const views = await this.listMyConsentsUseCase.invoke(user.userId);
    return views.map((view) => ConsentStatusResponse.from(view));
  }
}
