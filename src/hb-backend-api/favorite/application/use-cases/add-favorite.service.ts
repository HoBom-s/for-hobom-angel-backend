import { Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";
import { FavoritePersistencePort } from "src/hb-backend-api/favorite/domain/ports/out/favorite-persistence.port";
import { FavoriteQueryPort } from "src/hb-backend-api/favorite/domain/ports/out/favorite-query.port";
import {
  AddFavoriteCommand,
  AddFavoriteUseCase,
} from "src/hb-backend-api/favorite/domain/ports/in/add-favorite.use-case";

/**
 * Favorites an animal or follows a shelter. Idempotent: a re-favorite is a no-op,
 * checked before insert (the unique index is the backstop under races).
 */
@Injectable()
export class AddFavoriteService implements AddFavoriteUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.FavoriteModule.FavoritePersistencePort)
    private readonly persistencePort: FavoritePersistencePort,
    @Inject(DIToken.FavoriteModule.FavoriteQueryPort)
    private readonly queryPort: FavoriteQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: AddFavoriteCommand): Promise<void> {
    const userId = UserId.fromString(command.userId);

    if (
      await this.queryPort.exists(userId, command.targetType, command.targetRef)
    ) {
      return;
    }

    await this.persistencePort.create(
      Favorite.create({
        userId,
        targetType: command.targetType,
        targetRef: command.targetRef,
      }),
    );
  }
}
