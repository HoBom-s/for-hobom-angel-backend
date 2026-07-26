import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { FavoriteEntity } from "src/hb-backend-api/favorite/domain/model/favorite.entity";
import { FavoriteRepository } from "src/hb-backend-api/favorite/domain/repositories/favorite.repository";

@Injectable()
export class FavoriteRepositoryImpl implements FavoriteRepository {
  constructor(
    @InjectModel(FavoriteEntity.name)
    private readonly model: Model<FavoriteEntity>,
  ) {}

  public async insert(doc: Partial<FavoriteEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.create([doc], { session });
  }

  public async delete(
    userId: Types.ObjectId,
    targetType: FavoriteTargetType,
    targetRef: string,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.deleteOne({ userId, targetType, targetRef }, { session });
  }

  public async exists(
    userId: Types.ObjectId,
    targetType: FavoriteTargetType,
    targetRef: string,
  ): Promise<boolean> {
    const found = await this.model
      .exists({ userId, targetType, targetRef })
      .exec();
    return found !== null;
  }

  public findByUser(
    userId: Types.ObjectId,
    targetType: FavoriteTargetType | undefined,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<FavoriteEntity[]> {
    const query: Record<string, unknown> = { userId };
    if (targetType) {
      query.targetType = targetType;
    }
    if (cursorId) {
      query._id = { $lt: cursorId };
    }
    return this.model
      .find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }
}
