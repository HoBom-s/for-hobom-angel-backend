import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ApiEnvelope,
  ApiEnvelopeArray,
} from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/shared/auth/current-user.decorator";
import { JwtAuthGuard } from "src/shared/auth/jwt-auth.guard";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";
import { ExportPersonalDataUseCase } from "src/hb-backend-api/dsar/domain/ports/in/export-personal-data.use-case";
import { GetErasureRequestUseCase } from "src/hb-backend-api/dsar/domain/ports/in/get-erasure-request.use-case";
import { ListSubjectErasuresUseCase } from "src/hb-backend-api/dsar/domain/ports/in/list-subject-erasures.use-case";
import { DsarRequestDto } from "src/hb-backend-api/dsar/adapters/in/dto/dsar-request.dto";
import { PersonalDataResponse } from "src/hb-backend-api/dsar/adapters/in/dto/personal-data.response";
import { ErasureRequestResponse } from "src/hb-backend-api/dsar/adapters/in/dto/erasure-request.response";

/**
 * DSAR operator surface — read-only. Provides data-subject access (export of
 * decrypted PII, audited as EXPORT_PII) and lookup of erasure requests/reports.
 * The erasure itself is NOT triggered here: it runs in the daily 03:00 sweep
 * ({@link ErasureWorker}) over withdrawn accounts past their grace window.
 *
 * Export decrypts PII into the response body only; the access-log interceptor
 * logs request context, never response bodies, so no PII enters the log pipeline.
 */
@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/admin/dsar`)
export class DsarController {
  constructor(
    @Inject(DIToken.DsarModule.ExportPersonalDataUseCase)
    private readonly exportUseCase: ExportPersonalDataUseCase,
    @Inject(DIToken.DsarModule.GetErasureRequestUseCase)
    private readonly getErasureRequestUseCase: GetErasureRequestUseCase,
    @Inject(DIToken.DsarModule.ListSubjectErasuresUseCase)
    private readonly listSubjectErasuresUseCase: ListSubjectErasuresUseCase,
  ) {}

  @ApiOperation({
    summary: "개인정보 열람 (DSAR export) — 운영자, EXPORT_PII 감사",
  })
  @ApiEnvelope(PersonalDataResponse)
  @HttpCode(HttpStatus.OK)
  @Post("subjects/:userId/export")
  public async export(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body() body: DsarRequestDto,
  ): Promise<PersonalDataResponse> {
    const data = await this.exportUseCase.invoke({
      actorId: user.userId,
      subjectId: userId,
      reason: body.reason,
    });
    return PersonalDataResponse.from(data);
  }

  @ApiOperation({ summary: "회원의 파기 요청·증명서 목록 — 운영자" })
  @ApiEnvelopeArray(ErasureRequestResponse)
  @Get("subjects/:userId/erasures")
  public async listBySubject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
  ): Promise<ErasureRequestResponse[]> {
    const views = await this.listSubjectErasuresUseCase.invoke({
      actorId: user.userId,
      subjectId: userId,
    });
    return views.map((view) => ErasureRequestResponse.from(view));
  }

  @ApiOperation({ summary: "파기 요청 상세·증명서 조회 — 운영자" })
  @ApiEnvelope(ErasureRequestResponse)
  @Get("erasures/:requestId")
  public async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("requestId") requestId: string,
  ): Promise<ErasureRequestResponse> {
    const view = await this.getErasureRequestUseCase.invoke({
      actorId: user.userId,
      requestId,
    });
    return ErasureRequestResponse.from(view);
  }
}
