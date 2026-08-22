import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ApiCreatedEnvelope,
  ApiEnvelopeCursor,
} from "src/shared/response/api-envelope.decorator";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { CursorQueryDto } from "src/shared/pagination/cursor-query.dto";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import {
  StartInquiryResult,
  StartInquiryUseCase,
} from "src/hb-backend-api/inquiry/domain/ports/in/start-inquiry.use-case";
import { ListMyInquiriesUseCase } from "src/hb-backend-api/inquiry/domain/ports/in/list-my-inquiries.use-case";
import { ListShelterInquiriesUseCase } from "src/hb-backend-api/inquiry/domain/ports/in/list-shelter-inquiries.use-case";
import { StartInquiryDto } from "src/hb-backend-api/inquiry/adapters/in/dto/start-inquiry.dto";
import { StartInquiryResponse } from "src/hb-backend-api/inquiry/adapters/in/dto/start-inquiry.response";
import { InquiryResponse } from "src/hb-backend-api/inquiry/adapters/in/dto/inquiry.response";

@ApiTags("Inquiries")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class InquiryController {
  constructor(
    @Inject(DIToken.InquiryModule.StartInquiryUseCase)
    private readonly startInquiryUseCase: StartInquiryUseCase,
    @Inject(DIToken.InquiryModule.ListMyInquiriesUseCase)
    private readonly listMyInquiriesUseCase: ListMyInquiriesUseCase,
    @Inject(DIToken.InquiryModule.ListShelterInquiriesUseCase)
    private readonly listShelterInquiriesUseCase: ListShelterInquiriesUseCase,
  ) {}

  @ApiOperation({
    summary: "보호소에 문의하기 (동물 상세) — 스레드 열고 첫 메시지 전송",
  })
  @ApiCreatedEnvelope(StartInquiryResponse)
  @Post("animals/:animalId/inquiries")
  public start(
    @CurrentUser() user: AuthenticatedUser,
    @Param("animalId") animalId: string,
    @Body() body: StartInquiryDto,
  ): Promise<StartInquiryResult> {
    return this.startInquiryUseCase.invoke({
      inquirerId: user.userId,
      animalId,
      message: body.message,
    });
  }

  @ApiOperation({ summary: "내 문의 목록 (커서)" })
  @ApiEnvelopeCursor(InquiryResponse)
  @Get("me/inquiries")
  public async listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CursorQueryDto,
  ): Promise<CursorPageResponse<InquiryResponse>> {
    const page = await this.listMyInquiriesUseCase.invoke({
      inquirerId: user.userId,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (item) => InquiryResponse.from(item));
  }

  @ApiOperation({ summary: "보호소 문의함 (담당자, 커서)" })
  @ApiEnvelopeCursor(InquiryResponse)
  @Get("shelters/:shelterId/inquiries")
  public async listForShelter(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Query() query: CursorQueryDto,
  ): Promise<CursorPageResponse<InquiryResponse>> {
    const page = await this.listShelterInquiriesUseCase.invoke({
      shelterId,
      actorId: user.userId,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (item) => InquiryResponse.from(item));
  }
}
