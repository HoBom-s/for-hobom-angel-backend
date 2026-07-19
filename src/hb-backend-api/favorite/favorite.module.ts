import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureModule } from "src/shared/erasure/erasure.module";
import { FavoriteDestroyer } from "src/hb-backend-api/favorite/adapters/erasure/favorite.destroyer";
import { FavoriteEntity } from "src/hb-backend-api/favorite/domain/model/favorite.entity";
import { FavoriteSchema } from "src/hb-backend-api/favorite/domain/model/favorite.schema";
import { FavoritePersistenceAdapter } from "src/hb-backend-api/favorite/adapters/out/favorite-persistence.adapter";
import { FavoriteQueryAdapter } from "src/hb-backend-api/favorite/adapters/out/favorite-query.adapter";
import { FavoriteRepositoryImpl } from "src/hb-backend-api/favorite/infra/repositories/favorite.repository.impl";
import { AddFavoriteService } from "src/hb-backend-api/favorite/application/use-cases/add-favorite.service";
import { RemoveFavoriteService } from "src/hb-backend-api/favorite/application/use-cases/remove-favorite.service";
import { ListFavoritesService } from "src/hb-backend-api/favorite/application/use-cases/list-favorites.service";
import { FavoriteController } from "src/hb-backend-api/favorite/adapters/in/favorite.controller";

/**
 * Favorites — members favoriting animals (찜) and following shelters (팔로우). Its
 * only invariant is uniqueness of (user, target); notifying a follower on status
 * changes is a later, outbox-driven concern.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FavoriteEntity.name, schema: FavoriteSchema },
    ]),
    ErasureModule,
  ],
  controllers: [FavoriteController],
  providers: [
    {
      provide: DIToken.FavoriteModule.AddFavoriteUseCase,
      useClass: AddFavoriteService,
    },
    {
      provide: DIToken.FavoriteModule.RemoveFavoriteUseCase,
      useClass: RemoveFavoriteService,
    },
    {
      provide: DIToken.FavoriteModule.ListFavoritesUseCase,
      useClass: ListFavoritesService,
    },
    {
      provide: DIToken.FavoriteModule.FavoriteRepository,
      useClass: FavoriteRepositoryImpl,
    },
    {
      provide: DIToken.FavoriteModule.FavoritePersistencePort,
      useClass: FavoritePersistenceAdapter,
    },
    {
      provide: DIToken.FavoriteModule.FavoriteQueryPort,
      useClass: FavoriteQueryAdapter,
    },
    FavoriteDestroyer,
  ],
})
export class FavoriteModule implements OnModuleInit {
  constructor(
    private readonly destroyerRegistry: DestroyerRegistry,
    private readonly favoriteDestroyer: FavoriteDestroyer,
  ) {}

  public onModuleInit(): void {
    this.destroyerRegistry.register(this.favoriteDestroyer);
  }
}
