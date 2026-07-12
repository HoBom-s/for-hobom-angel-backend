import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import {
  SubmitReportResult,
  SubmitReportUseCase,
} from "src/hb-backend-api/report/domain/ports/in/submit-report.use-case";
import { ResolveReportUseCase } from "src/hb-backend-api/report/domain/ports/in/resolve-report.use-case";
import { ListPendingReportsUseCase } from "src/hb-backend-api/report/domain/ports/in/list-pending-reports.use-case";
import { SubmitReportDto } from "src/hb-backend-api/report/adapters/in/dto/submit-report.dto";
import { ResolveReportDto } from "src/hb-backend-api/report/adapters/in/dto/resolve-report.dto";
import { ReportResponse } from "src/hb-backend-api/report/adapters/in/dto/report.response";

@ApiTags("Reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/reports`)
export class ReportController {
  constructor(
    @Inject(DIToken.ReportModule.SubmitReportUseCase)
    private readonly submitReportUseCase: SubmitReportUseCase,
    @Inject(DIToken.ReportModule.ResolveReportUseCase)
    private readonly resolveReportUseCase: ResolveReportUseCase,
    @Inject(DIToken.ReportModule.ListPendingReportsUseCase)
    private readonly listPendingReportsUseCase: ListPendingReportsUseCase,
  ) {}

  @ApiOperation({ summary: "신고 접수" })
  @Post()
  public submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SubmitReportDto,
  ): Promise<SubmitReportResult> {
    return this.submitReportUseCase.invoke({
      reporterId: user.userId,
      targetType: body.targetType,
      targetRef: body.targetRef,
      reason: body.reason,
      detail: body.detail,
    });
  }

  @ApiOperation({ summary: "신고 처리 큐 (운영자)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ type: [ReportResponse] })
  @Get("pending")
  public async pending(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<ReportResponse[]> {
    const reports = await this.listPendingReportsUseCase.invoke({
      viewerId: user.userId,
      limit: Math.min(Math.max(limit, 1), 100),
    });
    return reports.map((report) => ReportResponse.from(report));
  }

  @ApiOperation({ summary: "신고 처리 (운영자)" })
  @Post(":reportId/resolution")
  public resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reportId") reportId: string,
    @Body() body: ResolveReportDto,
  ): Promise<void> {
    return this.resolveReportUseCase.invoke({
      reportId,
      resolvedBy: user.userId,
      resolution: body.resolution,
      note: body.note,
    });
  }
}
