import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";
import { FavoritePersistencePort } from "src/hb-backend-api/favorite/domain/ports/out/favorite-persistence.port";
import { FavoriteRepository } from "src/hb-backend-api/favorite/domain/repositories/favorite.repository";
import { toInsertDoc } from "src/hb-backend-api/favorite/adapters/out/favorite.mapper";

@Injectable()
export class FavoritePersistenceAdapter implements FavoritePersistencePort {
  constructor(
    @Inject(DIToken.FavoriteModule.FavoriteRepository)
    private readonly repository: FavoriteRepository,
  ) {}

  public async create(favorite: Favorite): Promise<void> {
    await this.repository.insert(toInsertDoc(favorite));
  }

  public async remove(
    userId: UserId,
    targetType: FavoriteTargetType,
    targetRef: string,
  ): Promise<void> {
    await this.repository.delete(userId.raw, targetType, targetRef);
  }
}
