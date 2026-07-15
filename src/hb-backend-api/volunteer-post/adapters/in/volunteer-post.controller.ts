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
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { CreateVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/create-volunteer-post.use-case";
import { DeleteVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/delete-volunteer-post.use-case";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { CreateVolunteerPostDto } from "src/hb-backend-api/volunteer-post/adapters/in/dto/create-volunteer-post.dto";
import { CreateVolunteerPostResponse } from "src/hb-backend-api/volunteer-post/adapters/in/dto/create-volunteer-post.response";
import { ListVolunteerPostsQueryDto } from "src/hb-backend-api/volunteer-post/adapters/in/dto/list-volunteer-posts.query.dto";
import { VolunteerPostResponse } from "src/hb-backend-api/volunteer-post/adapters/in/dto/volunteer-post.response";

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
    @Inject(DIToken.VolunteerPostModule.VolunteerPostQueryPort)
    private readonly queryPort: VolunteerPostQueryPort,
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
      eventId: body.eventId,
      body: body.body,
      imageKeys: body.imageKeys,
    });
    return CreateVolunteerPostResponse.from(result);
  }

  @ApiOperation({ summary: "봉사 후기 피드 (최신순·커서)" })
  @ApiEnvelopeCursor(VolunteerPostResponse)
  @Get()
  public async feed(
    @Query() query: ListVolunteerPostsQueryDto,
  ): Promise<CursorPageResponse<VolunteerPostResponse>> {
    const page = await this.queryPort.findFeed({
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (post) =>
      VolunteerPostResponse.from(post),
    );
  }

  @ApiOperation({ summary: "봉사 후기 단건 조회" })
  @ApiEnvelope(VolunteerPostResponse)
  @Get(":postId")
  public async getOne(
    @Param("postId") postId: string,
  ): Promise<VolunteerPostResponse> {
    const post = await this.queryPort.findById(
      VolunteerPostId.fromString(postId),
    );
    if (!post) {
      throw new NotFoundException("후기를 찾을 수 없어요.");
    }
    return VolunteerPostResponse.from(post);
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
