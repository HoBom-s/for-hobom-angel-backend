import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";

export interface AddFavoriteCommand {
  userId: string;
  targetType: FavoriteTargetType;
  targetRef: string;
}

/** Favorites an animal or follows a shelter (idempotent). */
export interface AddFavoriteUseCase {
  invoke(command: AddFavoriteCommand): Promise<void>;
}
