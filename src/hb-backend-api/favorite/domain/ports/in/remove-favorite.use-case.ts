import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";

export interface RemoveFavoriteCommand {
  userId: string;
  targetType: FavoriteTargetType;
  targetRef: string;
}

/** Unfavorites an animal or unfollows a shelter (idempotent). */
export interface RemoveFavoriteUseCase {
  invoke(command: RemoveFavoriteCommand): Promise<void>;
}
