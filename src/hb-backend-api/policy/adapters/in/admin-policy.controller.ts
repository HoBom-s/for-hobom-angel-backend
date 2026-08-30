import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseEnumPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
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
import { PublishPolicyUseCase } from "src/hb-backend-api/policy/domain/ports/in/publish-policy.use-case";
import { ListPolicyVersionsUseCase } from "src/hb-backend-api/policy/domain/ports/in/list-policy-versions.use-case";
import { PublishPolicyDto } from "src/hb-backend-api/policy/adapters/in/dto/publish-policy.dto";
import { PolicyResponse } from "src/hb-backend-api/policy/adapters/in/dto/policy.response";
import { PolicyVersionResponse } from "src/hb-backend-api/policy/adapters/in/dto/policy-version.response";

/**
 * Operator policy CMS — publish a new version (archiving the prior) and view the
 * version history. Operator only (the use-cases assert platform admin).
 */
@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class AdminPolicyController {
  constructor(
    @Inject(DIToken.PolicyModule.PublishPolicyUseCase)
    private readonly publishPolicyUseCase: PublishPolicyUseCase,
    @Inject(DIToken.PolicyModule.ListPolicyVersionsUseCase)
    private readonly listPolicyVersionsUseCase: ListPolicyVersionsUseCase,
  ) {}

  @ApiOperation({ summary: "정책 문서 게시 (새 버전) — 운영자" })
  @ApiCreatedEnvelope(PolicyResponse)
  @Post("admin/policies")
  public async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: PublishPolicyDto,
  ): Promise<PolicyResponse> {
    const document = await this.publishPolicyUseCase.invoke({
      actorId: user.userId,
      type: body.type,
      title: body.title,
      content: body.content,
      effectiveDate: body.effectiveDate,
    });
    return PolicyResponse.from(document);
  }

  @ApiOperation({ summary: "정책 문서 버전 이력 — 운영자" })
  @ApiEnvelopeArray(PolicyVersionResponse)
  @Get("admin/policies/:type/versions")
  public async versions(
    @CurrentUser() user: AuthenticatedUser,
    @Param("type", new ParseEnumPipe(PolicyType)) type: PolicyType,
  ): Promise<PolicyVersionResponse[]> {
    const documents = await this.listPolicyVersionsUseCase.invoke({
      actorId: user.userId,
      type,
    });
    return documents.map((document) => PolicyVersionResponse.from(document));
  }
}
