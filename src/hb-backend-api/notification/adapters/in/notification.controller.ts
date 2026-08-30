import {
  Controller,
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
  ApiEnvelope,
  ApiEnvelopeCursor,
} from "src/shared/response/api-envelope.decorator";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { CursorQueryDto } from "src/shared/pagination/cursor-query.dto";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/shared/auth/current-user.decorator";
import { JwtAuthGuard } from "src/shared/auth/jwt-auth.guard";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";
import { ListMyNotificationsUseCase } from "src/hb-backend-api/notification/domain/ports/in/list-my-notifications.use-case";
import { CountUnreadNotificationsUseCase } from "src/hb-backend-api/notification/domain/ports/in/count-unread-notifications.use-case";
import { MarkNotificationReadUseCase } from "src/hb-backend-api/notification/domain/ports/in/mark-notification-read.use-case";
import { MarkAllNotificationsReadUseCase } from "src/hb-backend-api/notification/domain/ports/in/mark-all-notifications-read.use-case";
import { NotificationResponse } from "src/hb-backend-api/notification/adapters/in/dto/notification.response";
import { UnreadCountResponse } from "src/hb-backend-api/notification/adapters/in/dto/unread-count.response";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/me/notifications`)
export class NotificationController {
  constructor(
    @Inject(DIToken.NotificationModule.ListMyNotificationsUseCase)
    private readonly listMyNotificationsUseCase: ListMyNotificationsUseCase,
    @Inject(DIToken.NotificationModule.CountUnreadNotificationsUseCase)
    private readonly countUnreadNotificationsUseCase: CountUnreadNotificationsUseCase,
    @Inject(DIToken.NotificationModule.MarkNotificationReadUseCase)
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    @Inject(DIToken.NotificationModule.MarkAllNotificationsReadUseCase)
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
  ) {}

  @ApiOperation({ summary: "내 알림 목록 (벨, 커서)" })
  @ApiEnvelopeCursor(NotificationResponse)
  @Get()
  public async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CursorQueryDto,
  ): Promise<CursorPageResponse<NotificationResponse>> {
    const page = await this.listMyNotificationsUseCase.invoke({
      recipientId: user.userId,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (notification) =>
      NotificationResponse.from(notification),
    );
  }

  @ApiOperation({ summary: "안 읽은 알림 수 (벨 뱃지)" })
  @ApiEnvelope(UnreadCountResponse)
  @Get("unread-count")
  public async unreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UnreadCountResponse> {
    const count = await this.countUnreadNotificationsUseCase.invoke(
      user.userId,
    );
    return UnreadCountResponse.of(count);
  }

  @ApiOperation({ summary: "모든 알림 읽음 처리" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("read-all")
  public async markAllRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.markAllNotificationsReadUseCase.invoke(user.userId);
  }

  @ApiOperation({ summary: "알림 읽음 처리 (본인)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(":notificationId/read")
  public async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param("notificationId") notificationId: string,
  ): Promise<void> {
    await this.markNotificationReadUseCase.invoke({
      notificationId,
      actorId: user.userId,
    });
  }
}
