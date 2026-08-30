import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopeCursor } from "src/shared/response/api-envelope.decorator";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/shared/auth/current-user.decorator";
import { JwtAuthGuard } from "src/shared/auth/jwt-auth.guard";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";
import { ListMyBookmarksUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/list-my-bookmarks.use-case";
import { ListVolunteerPostsQueryDto } from "src/hb-backend-api/volunteer-post/adapters/in/dto/list-volunteer-posts.query.dto";
import { VolunteerPostResponse } from "src/hb-backend-api/volunteer-post/adapters/in/dto/volunteer-post.response";

@ApiTags("Volunteer")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class MyBookmarksController {
  constructor(
    @Inject(DIToken.VolunteerPostModule.ListMyBookmarksUseCase)
    private readonly listMyBookmarksUseCase: ListMyBookmarksUseCase,
  ) {}

  @ApiOperation({ summary: "내가 저장한 봉사 후기 (최근 저장순·커서)" })
  @ApiEnvelopeCursor(VolunteerPostResponse)
  @Get("me/volunteer-post-bookmarks")
  public async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListVolunteerPostsQueryDto,
  ): Promise<CursorPageResponse<VolunteerPostResponse>> {
    const page = await this.listMyBookmarksUseCase.invoke({
      viewerId: user.userId,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (item) =>
      VolunteerPostResponse.from(item),
    );
  }
}
