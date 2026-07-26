import { Types } from "mongoose";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { FavoriteEntity } from "src/hb-backend-api/favorite/domain/model/favorite.entity";

/** Persistence contract over the favorites collection. */
export interface FavoriteRepository {
  insert(doc: Partial<FavoriteEntity>): Promise<void>;
  delete(
    userId: Types.ObjectId,
    targetType: FavoriteTargetType,
    targetRef: string,
  ): Promise<void>;
  exists(
    userId: Types.ObjectId,
    targetType: FavoriteTargetType,
    targetRef: string,
  ): Promise<boolean>;
  /** A member's favorites, keyset-paginated newest-first (returns up to limit+1). */
  findByUser(
    userId: Types.ObjectId,
    targetType: FavoriteTargetType | undefined,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<FavoriteEntity[]>;
}
