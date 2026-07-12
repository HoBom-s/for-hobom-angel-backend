import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/** Write-side port for favorites. */
export interface FavoritePersistencePort {
  create(favorite: Favorite): Promise<void>;
  remove(
    userId: UserId,
    targetType: FavoriteTargetType,
    targetRef: string,
  ): Promise<void>;
}
