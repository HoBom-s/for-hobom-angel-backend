import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseEnumPipe,
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
import { ApiEnvelopeCursor } from "src/shared/response/api-envelope.decorator";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { AddFavoriteUseCase } from "src/hb-backend-api/favorite/domain/ports/in/add-favorite.use-case";
import { RemoveFavoriteUseCase } from "src/hb-backend-api/favorite/domain/ports/in/remove-favorite.use-case";
import { ListFavoritesUseCase } from "src/hb-backend-api/favorite/domain/ports/in/list-favorites.use-case";
import { AddFavoriteDto } from "src/hb-backend-api/favorite/adapters/in/dto/add-favorite.dto";
import { ListFavoritesQueryDto } from "src/hb-backend-api/favorite/adapters/in/dto/list-favorites.query.dto";
import { FavoriteResponse } from "src/hb-backend-api/favorite/adapters/in/dto/favorite.response";

@ApiTags("Favorites")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/favorites`)
export class FavoriteController {
  constructor(
    @Inject(DIToken.FavoriteModule.AddFavoriteUseCase)
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    @Inject(DIToken.FavoriteModule.RemoveFavoriteUseCase)
    private readonly removeFavoriteUseCase: RemoveFavoriteUseCase,
    @Inject(DIToken.FavoriteModule.ListFavoritesUseCase)
    private readonly listFavoritesUseCase: ListFavoritesUseCase,
  ) {}

  @ApiOperation({ summary: "찜/팔로우 추가 (멱등)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post()
  public add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AddFavoriteDto,
  ): Promise<void> {
    return this.addFavoriteUseCase.invoke({
      userId: user.userId,
      targetType: body.targetType,
      targetRef: body.targetRef,
    });
  }

  @ApiOperation({ summary: "찜/팔로우 해제" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":targetType/:targetRef")
  public remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("targetType", new ParseEnumPipe(FavoriteTargetType))
    targetType: FavoriteTargetType,
    @Param("targetRef") targetRef: string,
  ): Promise<void> {
    return this.removeFavoriteUseCase.invoke({
      userId: user.userId,
      targetType,
      targetRef,
    });
  }

  @ApiOperation({ summary: "내 찜/팔로우 목록 (최신순, 커서 페이지네이션)" })
  @ApiEnvelopeCursor(FavoriteResponse)
  @Get()
  public async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListFavoritesQueryDto,
  ): Promise<CursorPageResponse<FavoriteResponse>> {
    const page = await this.listFavoritesUseCase.invoke({
      userId: user.userId,
      targetType: query.targetType,
      cursor: query.cursor,
      limit: query.limit ?? 20,
    });
    return CursorPageResponse.of(page, (favorite) =>
      FavoriteResponse.from(favorite),
    );
  }
}
