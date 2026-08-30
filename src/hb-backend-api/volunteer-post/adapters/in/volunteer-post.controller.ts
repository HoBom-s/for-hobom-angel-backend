import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
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
  ApiCreatedEnvelope,
  ApiEnvelope,
  ApiEnvelopeCursor,
} from "src/shared/response/api-envelope.decorator";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/shared/auth/current-user.decorator";
import { JwtAuthGuard } from "src/shared/auth/jwt-auth.guard";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";
import { CreateVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/create-volunteer-post.use-case";
import { DeleteVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/delete-volunteer-post.use-case";
import { LikeVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/like-volunteer-post.use-case";
import { ReadVolunteerFeedUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";
import { CommentVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/comment-volunteer-post.use-case";
import { BookmarkVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/bookmark-volunteer-post.use-case";
import { VolunteerPostCommentPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-comment.port";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { CreateVolunteerPostDto } from "src/hb-backend-api/volunteer-post/adapters/in/dto/create-volunteer-post.dto";
import { CreateVolunteerPostResponse } from "src/hb-backend-api/volunteer-post/adapters/in/dto/create-volunteer-post.response";
import { ListVolunteerPostsQueryDto } from "src/hb-backend-api/volunteer-post/adapters/in/dto/list-volunteer-posts.query.dto";
import { VolunteerPostResponse } from "src/hb-backend-api/volunteer-post/adapters/in/dto/volunteer-post.response";
import { CreateCommentDto } from "src/hb-backend-api/volunteer-post/adapters/in/dto/create-comment.dto";
import {
  CommentResponse,
  CreateCommentResponse,
} from "src/hb-backend-api/volunteer-post/adapters/in/dto/comment.response";

@ApiTags("Volunteer")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/volunteer-posts`)
export class VolunteerPostController {
  constructor(
    @Inject(DIToken.VolunteerPostModule.CreateVolunteerPostUseCase)
    private readonly createVolunteerPostUseCase: CreateVolunteerPostUseCase,
    @Inject(DIToken.VolunteerPostModule.DeleteVolunteerPostUseCase)
    private readonly deleteVolunteerPostUseCase: DeleteVolunteerPostUseCase,
    @Inject(DIToken.VolunteerPostModule.LikeVolunteerPostUseCase)
    private readonly likeVolunteerPostUseCase: LikeVolunteerPostUseCase,
    @Inject(DIToken.VolunteerPostModule.ReadVolunteerFeedUseCase)
    private readonly readVolunteerFeedUseCase: ReadVolunteerFeedUseCase,
    @Inject(DIToken.VolunteerPostModule.CommentVolunteerPostUseCase)
    private readonly commentVolunteerPostUseCase: CommentVolunteerPostUseCase,
    @Inject(DIToken.VolunteerPostModule.BookmarkVolunteerPostUseCase)
    private readonly bookmarkVolunteerPostUseCase: BookmarkVolunteerPostUseCase,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostCommentPort)
    private readonly commentPort: VolunteerPostCommentPort,
  ) {}

  @ApiOperation({ summary: "봉사 후기 작성 (§05)" })
  @ApiCreatedEnvelope(CreateVolunteerPostResponse)
  @Post()
  public async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateVolunteerPostDto,
  ): Promise<CreateVolunteerPostResponse> {
    const result = await this.createVolunteerPostUseCase.invoke({
      authorId: user.userId,
      shelterId: body.shelterId,
      eventId: body.eventId,
      content: body.content,
    });
    return CreateVolunteerPostResponse.from(result);
  }

  @ApiOperation({ summary: "봉사 후기 피드 (최신순·커서, 좋아요 포함)" })
  @ApiEnvelopeCursor(VolunteerPostResponse)
  @Get()
  public async feed(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListVolunteerPostsQueryDto,
  ): Promise<CursorPageResponse<VolunteerPostResponse>> {
    const page = await this.readVolunteerFeedUseCase.feed({
      viewerId: user.userId,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (item) =>
      VolunteerPostResponse.from(item),
    );
  }

  @ApiOperation({ summary: "봉사 후기 단건 조회" })
  @ApiEnvelope(VolunteerPostResponse)
  @Get(":postId")
  public async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("postId") postId: string,
  ): Promise<VolunteerPostResponse> {
    const item = await this.readVolunteerFeedUseCase.one(postId, user.userId);
    if (!item) {
      throw new NotFoundException("후기를 찾을 수 없어요.");
    }
    return VolunteerPostResponse.from(item);
  }

  @ApiOperation({ summary: "봉사 후기 좋아요" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(":postId/likes")
  public like(
    @CurrentUser() user: AuthenticatedUser,
    @Param("postId") postId: string,
  ): Promise<void> {
    return this.likeVolunteerPostUseCase.like({ postId, userId: user.userId });
  }

  @ApiOperation({ summary: "봉사 후기 좋아요 취소" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":postId/likes")
  public unlike(
    @CurrentUser() user: AuthenticatedUser,
    @Param("postId") postId: string,
  ): Promise<void> {
    return this.likeVolunteerPostUseCase.unlike({
      postId,
      userId: user.userId,
    });
  }

  @ApiOperation({ summary: "봉사 후기 댓글 작성" })
  @ApiCreatedEnvelope(CreateCommentResponse)
  @Post(":postId/comments")
  public async comment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("postId") postId: string,
    @Body() body: CreateCommentDto,
  ): Promise<CreateCommentResponse> {
    const result = await this.commentVolunteerPostUseCase.create({
      postId,
      authorId: user.userId,
      body: body.body,
    });
    return CreateCommentResponse.from(result);
  }

  @ApiOperation({ summary: "봉사 후기 댓글 목록 (오래된 순·커서)" })
  @ApiEnvelopeCursor(CommentResponse)
  @Get(":postId/comments")
  public async comments(
    @Param("postId") postId: string,
    @Query() query: ListVolunteerPostsQueryDto,
  ): Promise<CursorPageResponse<CommentResponse>> {
    const page = await this.commentPort.listByPost({
      postId: VolunteerPostId.fromString(postId),
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (comment) =>
      CommentResponse.from(comment),
    );
  }

  @ApiOperation({ summary: "봉사 후기 댓글 삭제 (작성자)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":postId/comments/:commentId")
  public deleteComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("commentId") commentId: string,
  ): Promise<void> {
    return this.commentVolunteerPostUseCase.delete({
      commentId,
      requesterId: user.userId,
    });
  }

  @ApiOperation({ summary: "봉사 후기 저장 (북마크)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(":postId/bookmarks")
  public bookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param("postId") postId: string,
  ): Promise<void> {
    return this.bookmarkVolunteerPostUseCase.bookmark({
      postId,
      userId: user.userId,
    });
  }

  @ApiOperation({ summary: "봉사 후기 저장 취소" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":postId/bookmarks")
  public unbookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param("postId") postId: string,
  ): Promise<void> {
    return this.bookmarkVolunteerPostUseCase.unbookmark({
      postId,
      userId: user.userId,
    });
  }

  @ApiOperation({ summary: "봉사 후기 삭제 (작성자)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":postId")
  public remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("postId") postId: string,
  ): Promise<void> {
    return this.deleteVolunteerPostUseCase.invoke({
      postId,
      requesterId: user.userId,
    });
  }
}
