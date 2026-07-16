import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { VolunteerPostCommentEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment.entity";
import { VolunteerPostCommentRepository } from "src/hb-backend-api/volunteer-post/domain/repositories/volunteer-post-comment.repository";

@Injectable()
export class VolunteerPostCommentRepositoryImpl implements VolunteerPostCommentRepository {
  constructor(
    @InjectModel(VolunteerPostCommentEntity.name)
    private readonly model: Model<VolunteerPostCommentEntity>,
  ) {}

  public async insert(doc: Partial<VolunteerPostCommentEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.create([doc], { session });
  }

  public async deleteById(id: Types.ObjectId): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.deleteOne({ _id: id }, { session });
  }

  public findById(
    id: Types.ObjectId,
  ): Promise<VolunteerPostCommentEntity | null> {
    return this.model.findById(id).exec();
  }

  public listByPost(
    postId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerPostCommentEntity[]> {
    const query = cursorId ? { postId, _id: { $gt: cursorId } } : { postId };
    return this.model
      .find(query)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .exec();
  }
}
