import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiEnvelope,
  ApiEnvelopeCursor,
} from "src/shared/response/api-envelope.decorator";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { DecideApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/decide-approval.use-case";
import { ListPendingApprovalsUseCase } from "src/hb-backend-api/approval/domain/ports/in/list-pending-approvals.use-case";
import { CountPendingApprovalsUseCase } from "src/hb-backend-api/approval/domain/ports/in/count-pending-approvals.use-case";
import { DecideApprovalDto } from "src/hb-backend-api/approval/adapters/in/dto/decide-approval.dto";
import { ListPendingApprovalsQueryDto } from "src/hb-backend-api/approval/adapters/in/dto/list-pending-approvals.query.dto";
import { PendingApprovalResponse } from "src/hb-backend-api/approval/adapters/in/dto/pending-approval.response";
import { PendingApprovalCountsResponse } from "src/hb-backend-api/approval/adapters/in/dto/pending-approval-counts.response";

@ApiTags("Approvals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/approvals`)
export class ApprovalController {
  constructor(
    @Inject(DIToken.ApprovalModule.DecideApprovalUseCase)
    private readonly decideApprovalUseCase: DecideApprovalUseCase,
    @Inject(DIToken.ApprovalModule.ListPendingApprovalsUseCase)
    private readonly listPendingApprovalsUseCase: ListPendingApprovalsUseCase,
    @Inject(DIToken.ApprovalModule.CountPendingApprovalsUseCase)
    private readonly countPendingApprovalsUseCase: CountPendingApprovalsUseCase,
  ) {}

  @ApiOperation({
    summary: "승인 대기 큐 (운영자) — 전체/유형별, 커서",
  })
  @ApiEnvelopeCursor(PendingApprovalResponse)
  @Get("pending")
  public async listPending(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPendingApprovalsQueryDto,
  ): Promise<CursorPageResponse<PendingApprovalResponse>> {
    const page = await this.listPendingApprovalsUseCase.invoke({
      viewerId: user.userId,
      type: query.type,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (request) =>
      PendingApprovalResponse.from(request),
    );
  }

  @ApiOperation({ summary: "승인 대기 유형별 개수 (운영자) — 탭 뱃지" })
  @ApiEnvelope(PendingApprovalCountsResponse)
  @Get("pending/counts")
  public async countPending(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PendingApprovalCountsResponse> {
    const counts = await this.countPendingApprovalsUseCase.invoke({
      viewerId: user.userId,
    });
    return PendingApprovalCountsResponse.from(counts);
  }

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
