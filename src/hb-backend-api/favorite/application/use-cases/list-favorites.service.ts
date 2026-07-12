import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";
import { FavoriteQueryPort } from "src/hb-backend-api/favorite/domain/ports/out/favorite-query.port";
import {
  ListFavoritesQuery,
  ListFavoritesUseCase,
} from "src/hb-backend-api/favorite/domain/ports/in/list-favorites.use-case";

/** Lists a member's favorites, newest first, optionally by target type. */
@Injectable()
export class ListFavoritesService implements ListFavoritesUseCase {
  constructor(
    @Inject(DIToken.FavoriteModule.FavoriteQueryPort)
    private readonly queryPort: FavoriteQueryPort,
  ) {}

  public invoke(query: ListFavoritesQuery): Promise<Favorite[]> {
    return this.queryPort.findByUser(
      UserId.fromString(query.userId),
      query.targetType,
    );
  }
}
