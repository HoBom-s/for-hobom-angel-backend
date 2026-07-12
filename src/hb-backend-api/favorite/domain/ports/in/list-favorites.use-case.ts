import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";

export interface ListFavoritesQuery {
  userId: string;
  targetType?: FavoriteTargetType;
}

/** Lists a member's favorites, newest first, optionally by target type. */
export interface ListFavoritesUseCase {
  invoke(query: ListFavoritesQuery): Promise<Favorite[]>;
}
