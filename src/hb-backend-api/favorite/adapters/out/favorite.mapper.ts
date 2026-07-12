import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";
import { FavoriteEntity } from "src/hb-backend-api/favorite/domain/model/favorite.entity";
import { FavoriteId } from "src/hb-backend-api/favorite/domain/model/vo/favorite-id.vo";

export function toDomain(doc: FavoriteEntity): Favorite {
  return Favorite.reconstitute({
    id: FavoriteId.fromString(String(doc._id)),
    userId: UserId.fromString(String(doc.userId)),
    targetType: doc.targetType,
    targetRef: doc.targetRef,
    favoritedAt: doc.createdAt ?? null,
  });
}

export function toInsertDoc(favorite: Favorite): Partial<FavoriteEntity> {
  return {
    _id: favorite.getId.raw,
    userId: favorite.getUserId.raw,
    targetType: favorite.getTargetType,
    targetRef: favorite.getTargetRef,
  };
}
