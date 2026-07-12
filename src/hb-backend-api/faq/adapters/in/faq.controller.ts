import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
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
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { FaqQueryPort } from "src/hb-backend-api/faq/domain/ports/out/faq-query.port";
import {
  PostFaqResult,
  PostFaqUseCase,
} from "src/hb-backend-api/faq/domain/ports/in/post-faq.use-case";
import { EditFaqUseCase } from "src/hb-backend-api/faq/domain/ports/in/edit-faq.use-case";
import { DeleteFaqUseCase } from "src/hb-backend-api/faq/domain/ports/in/delete-faq.use-case";
import { PostFaqDto } from "src/hb-backend-api/faq/adapters/in/dto/post-faq.dto";
import { EditFaqDto } from "src/hb-backend-api/faq/adapters/in/dto/edit-faq.dto";
import { ListFaqsQueryDto } from "src/hb-backend-api/faq/adapters/in/dto/list-faqs.query.dto";
import { FaqResponse } from "src/hb-backend-api/faq/adapters/in/dto/faq.response";

@ApiTags("FAQ")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class FaqController {
  constructor(
    @Inject(DIToken.FaqModule.PostFaqUseCase)
    private readonly postFaqUseCase: PostFaqUseCase,
    @Inject(DIToken.FaqModule.EditFaqUseCase)
    private readonly editFaqUseCase: EditFaqUseCase,
    @Inject(DIToken.FaqModule.DeleteFaqUseCase)
    private readonly deleteFaqUseCase: DeleteFaqUseCase,
    @Inject(DIToken.FaqModule.FaqQueryPort)
    private readonly faqQueryPort: FaqQueryPort,
  ) {}

  @ApiOperation({ summary: "FAQ 등록 (보호소 담당자)" })
  @Post("shelters/:shelterId/faqs")
  public post(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Body() body: PostFaqDto,
  ): Promise<PostFaqResult> {
    return this.postFaqUseCase.invoke({
      shelterId,
      authorId: user.userId,
      question: body.question,
      answer: body.answer,
      order: body.order ?? 0,
    });
  }

  @ApiOperation({ summary: "보호소 FAQ 목록 (정렬 순서)" })
  @ApiResponse({ type: [FaqResponse] })
  @Get("shelters/:shelterId/faqs")
  public async list(
    @Param("shelterId") shelterId: string,
    @Query() query: ListFaqsQueryDto,
  ): Promise<FaqResponse[]> {
    const faqs = await this.faqQueryPort.findByShelter(
      ShelterId.fromString(shelterId),
      query.limit ?? 50,
    );
    return faqs.map((faq) => FaqResponse.from(faq));
  }

  @ApiOperation({ summary: "FAQ 수정 (보호소 담당자)" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch("faqs/:faqId")
  public async edit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("faqId") faqId: string,
    @Body() body: EditFaqDto,
  ): Promise<void> {
    await this.editFaqUseCase.invoke({
      faqId,
      editorId: user.userId,
      question: body.question,
      answer: body.answer,
      order: body.order,
    });
  }

  @ApiOperation({ summary: "FAQ 삭제 (보호소 담당자 또는 운영자)" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("faqs/:faqId")
  public async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("faqId") faqId: string,
  ): Promise<void> {
    await this.deleteFaqUseCase.invoke({
      faqId,
      requesterId: user.userId,
    });
  }
}
