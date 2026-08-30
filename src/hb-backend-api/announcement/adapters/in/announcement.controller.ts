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
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { AnnouncementQueryPort } from "src/hb-backend-api/announcement/domain/ports/out/announcement-query.port";
import {
  PostAnnouncementResult,
  PostAnnouncementUseCase,
} from "src/hb-backend-api/announcement/domain/ports/in/post-announcement.use-case";
import { EditAnnouncementUseCase } from "src/hb-backend-api/announcement/domain/ports/in/edit-announcement.use-case";
import { DeleteAnnouncementUseCase } from "src/hb-backend-api/announcement/domain/ports/in/delete-announcement.use-case";
import { PostAnnouncementDto } from "src/hb-backend-api/announcement/adapters/in/dto/post-announcement.dto";
import { EditAnnouncementDto } from "src/hb-backend-api/announcement/adapters/in/dto/edit-announcement.dto";
import { ListAnnouncementsQueryDto } from "src/hb-backend-api/announcement/adapters/in/dto/list-announcements.query.dto";
import { AnnouncementResponse } from "src/hb-backend-api/announcement/adapters/in/dto/announcement.response";
import { PostAnnouncementResponse } from "src/hb-backend-api/announcement/adapters/in/dto/post-announcement.response";

@ApiTags("Announcements")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class AnnouncementController {
  constructor(
    @Inject(DIToken.AnnouncementModule.PostAnnouncementUseCase)
    private readonly postAnnouncementUseCase: PostAnnouncementUseCase,
    @Inject(DIToken.AnnouncementModule.EditAnnouncementUseCase)
    private readonly editAnnouncementUseCase: EditAnnouncementUseCase,
    @Inject(DIToken.AnnouncementModule.DeleteAnnouncementUseCase)
    private readonly deleteAnnouncementUseCase: DeleteAnnouncementUseCase,
    @Inject(DIToken.AnnouncementModule.AnnouncementQueryPort)
    private readonly announcementQueryPort: AnnouncementQueryPort,
  ) {}

  @ApiOperation({ summary: "공지 등록 (보호소 담당자)" })
  @ApiCreatedEnvelope(PostAnnouncementResponse)
  @Post("shelters/:shelterId/announcements")
  public post(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Body() body: PostAnnouncementDto,
  ): Promise<PostAnnouncementResult> {
    return this.postAnnouncementUseCase.invoke({
      shelterId,
      authorId: user.userId,
      title: body.title,
      body: body.body,
      pinned: body.pinned ?? false,
    });
  }

  @ApiOperation({ summary: "보호소 공지 목록 (고정 우선, 최신순)" })
  @ApiEnvelopeArray(AnnouncementResponse)
  @Get("shelters/:shelterId/announcements")
  public async list(
    @Param("shelterId") shelterId: string,
    @Query() query: ListAnnouncementsQueryDto,
  ): Promise<AnnouncementResponse[]> {
    const announcements = await this.announcementQueryPort.findByShelter(
      ShelterId.fromString(shelterId),
      query.limit ?? 20,
    );
    return announcements.map((a) => AnnouncementResponse.from(a));
  }

  @ApiOperation({ summary: "공지 수정 (보호소 담당자)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch("announcements/:announcementId")
  public async edit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("announcementId") announcementId: string,
    @Body() body: EditAnnouncementDto,
  ): Promise<void> {
    await this.editAnnouncementUseCase.invoke({
      announcementId,
      editorId: user.userId,
      title: body.title,
      body: body.body,
      pinned: body.pinned,
    });
  }

  @ApiOperation({ summary: "공지 삭제 (보호소 담당자 또는 운영자)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("announcements/:announcementId")
  public async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("announcementId") announcementId: string,
  ): Promise<void> {
    await this.deleteAnnouncementUseCase.invoke({
      announcementId,
      requesterId: user.userId,
    });
  }
}
