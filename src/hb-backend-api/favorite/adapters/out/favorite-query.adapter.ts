import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { parseCursor, toCursorPage } from "src/shared/pagination/keyset";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";
import { FavoriteQueryPort } from "src/hb-backend-api/favorite/domain/ports/out/favorite-query.port";
import { FavoriteRepository } from "src/hb-backend-api/favorite/domain/repositories/favorite.repository";
import { toDomain } from "src/hb-backend-api/favorite/adapters/out/favorite.mapper";

@Injectable()
export class FavoriteQueryAdapter implements FavoriteQueryPort {
  constructor(
    @Inject(DIToken.FavoriteModule.FavoriteRepository)
    private readonly repository: FavoriteRepository,
  ) {}

  public exists(
    userId: UserId,
    targetType: FavoriteTargetType,
    targetRef: string,
  ): Promise<boolean> {
    return this.repository.exists(userId.raw, targetType, targetRef);
  }

  public async findByUser(
    userId: UserId,
    targetType: FavoriteTargetType | undefined,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<Favorite>> {
    const cursorId = parseCursor(cursor);
    const docs = await this.repository.findByUser(
      userId.raw,
      targetType,
      cursorId,
      limit,
    );
    return toCursorPage(docs, limit, toDomain);
  }
}
