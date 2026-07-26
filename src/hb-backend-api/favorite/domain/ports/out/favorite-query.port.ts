import { Page } from "src/shared/pagination/page";
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
  /** A member's favorites, cursor-paginated newest-first. */
  findByUser(
    userId: UserId,
    targetType: FavoriteTargetType | undefined,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<Favorite>>;
}
