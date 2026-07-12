import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/** Read-side port for favorites. */
export interface FavoriteQueryPort {
  exists(
    userId: UserId,
    targetType: FavoriteTargetType,
    targetRef: string,
  ): Promise<boolean>;
  findByUser(
    userId: UserId,
    targetType?: FavoriteTargetType,
  ): Promise<Favorite[]>;
}
