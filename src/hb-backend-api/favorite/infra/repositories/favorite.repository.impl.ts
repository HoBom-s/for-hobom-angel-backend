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
    targetType?: FavoriteTargetType,
  ): Promise<FavoriteEntity[]> {
    return this.model
      .find(targetType ? { userId, targetType } : { userId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
