import { Controller, Get, Inject, Param, ParseEnumPipe } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelope } from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { GetCurrentPolicyUseCase } from "src/hb-backend-api/policy/domain/ports/in/get-current-policy.use-case";
import { PolicyResponse } from "src/hb-backend-api/policy/adapters/in/dto/policy.response";

/**
 * Public legal-document reads — the privacy policy / terms / operating policy the
 * FE footer links to. Unauthenticated on purpose: these must be viewable by
 * anyone, including logged-out visitors.
 */
@ApiTags("Policy")
@Controller(EndPointPrefixConstant)
export class PolicyController {
  constructor(
    @Inject(DIToken.PolicyModule.GetCurrentPolicyUseCase)
    private readonly getCurrentPolicyUseCase: GetCurrentPolicyUseCase,
  ) {}

  @ApiOperation({ summary: "현재 시행 중인 정책 문서 열람 (공개)" })
  @ApiEnvelope(PolicyResponse)
  @Get("policies/:type")
  public async current(
    @Param("type", new ParseEnumPipe(PolicyType)) type: PolicyType,
  ): Promise<PolicyResponse> {
    return PolicyResponse.from(await this.getCurrentPolicyUseCase.invoke(type));
  }
}
