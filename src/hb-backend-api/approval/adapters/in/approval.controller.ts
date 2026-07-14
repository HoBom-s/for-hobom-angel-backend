import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { DecideApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/decide-approval.use-case";
import { DecideApprovalDto } from "src/hb-backend-api/approval/adapters/in/dto/decide-approval.dto";

@ApiTags("Approvals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/approvals`)
export class ApprovalController {
  constructor(
    @Inject(DIToken.ApprovalModule.DecideApprovalUseCase)
    private readonly decideApprovalUseCase: DecideApprovalUseCase,
  ) {}

  @ApiOperation({
    summary:
      "승인 요청 결정 (유형별 결정권자: 운영자/보호소 대표/보호소). 유형별 콜백이 대상 애그리거트를 전이",
  })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(":requestId/decision")
  public async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param("requestId") requestId: string,
    @Body() body: DecideApprovalDto,
  ): Promise<void> {
    await this.decideApprovalUseCase.invoke({
      requestId: ApprovalId.fromString(requestId),
      actorId: user.userId,
      decision: ApprovalDecision.of(body.decision),
      reason: body.reason,
      metadata: body.metadata,
    });
  }
}
