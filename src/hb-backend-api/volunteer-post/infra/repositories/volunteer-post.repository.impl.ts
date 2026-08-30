import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { keysetFilter } from "src/shared/pagination/keyset";
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";
import { VolunteerPostRepository } from "src/hb-backend-api/volunteer-post/domain/repositories/volunteer-post.repository";

@Injectable()
export class VolunteerPostRepositoryImpl implements VolunteerPostRepository {
  constructor(
    @InjectModel(VolunteerPostEntity.name)
    private readonly model: Model<VolunteerPostEntity>,
  ) {}

  public async insert(
    doc: Partial<VolunteerPostEntity>,
  ): Promise<VolunteerPostEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.model.create([doc], { session });
    return created;
  }

  public async deleteById(id: Types.ObjectId): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.deleteOne({ _id: id }, { session });
  }

  public async incrementLikeCount(
    id: Types.ObjectId,
    delta: number,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateOne(
      { _id: id },
      { $inc: { likeCount: delta } },
      { session },
    );
  }

  public async incrementCommentCount(
    id: Types.ObjectId,
    delta: number,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateOne(
      { _id: id },
      { $inc: { commentCount: delta } },
      { session },
    );
  }

  public findById(id: Types.ObjectId): Promise<VolunteerPostEntity | null> {
    return this.model.findById(id).exec();
  }

  public findByIds(ids: Types.ObjectId[]): Promise<VolunteerPostEntity[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.model.find({ _id: { $in: ids } }).exec();
  }

  public listFeed(
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerPostEntity[]> {
    return this.model
      .find(keysetFilter(cursorId))
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }
}
