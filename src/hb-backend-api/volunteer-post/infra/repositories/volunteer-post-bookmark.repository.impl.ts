import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { keysetFilter } from "src/shared/pagination/keyset";
import { VolunteerPostBookmarkEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-bookmark.entity";
import { VolunteerPostBookmarkRepository } from "src/hb-backend-api/volunteer-post/domain/repositories/volunteer-post-bookmark.repository";

@Injectable()
export class VolunteerPostBookmarkRepositoryImpl implements VolunteerPostBookmarkRepository {
  constructor(
    @InjectModel(VolunteerPostBookmarkEntity.name)
    private readonly model: Model<VolunteerPostBookmarkEntity>,
  ) {}

  public async addIfAbsent(
    postId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateOne(
      { postId, userId },
      { $setOnInsert: { postId, userId } },
      { upsert: true, session },
    );
    return result.upsertedCount === 1;
  }

  public async remove(
    postId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.deleteOne({ postId, userId }, { session });
    return result.deletedCount === 1;
  }

  public async findBookmarkedPostIds(
    userId: Types.ObjectId,
    postIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    if (postIds.length === 0) {
      return [];
    }
    const docs = await this.model
      .find({ userId, postId: { $in: postIds } })
      .select("postId")
      .exec();
    return docs.map((doc) => doc.postId);
  }

  public listByUser(
    userId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerPostBookmarkEntity[]> {
    return this.model
      .find({ userId, ...keysetFilter(cursorId) })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }
}
