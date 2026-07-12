import { Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FavoritePersistencePort } from "src/hb-backend-api/favorite/domain/ports/out/favorite-persistence.port";
import {
  RemoveFavoriteCommand,
  RemoveFavoriteUseCase,
} from "src/hb-backend-api/favorite/domain/ports/in/remove-favorite.use-case";

/** Unfavorites an animal or unfollows a shelter (idempotent). */
@Injectable()
export class RemoveFavoriteService implements RemoveFavoriteUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.FavoriteModule.FavoritePersistencePort)
    private readonly persistencePort: FavoritePersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: RemoveFavoriteCommand): Promise<void> {
    await this.persistencePort.remove(
      UserId.fromString(command.userId),
      command.targetType,
      command.targetRef,
    );
  }
}
