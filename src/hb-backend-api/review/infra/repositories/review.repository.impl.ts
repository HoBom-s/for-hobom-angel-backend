import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { keysetFilter } from "src/shared/pagination/keyset";
import { ReviewEntity } from "src/hb-backend-api/review/domain/model/review.entity";
import { ShelterReputation } from "src/hb-backend-api/review/domain/model/shelter-reputation";
import {
  ReviewMutablePatch,
  ReviewRepository,
} from "src/hb-backend-api/review/domain/repositories/review.repository";

@Injectable()
export class ReviewRepositoryImpl implements ReviewRepository {
  constructor(
    @InjectModel(ReviewEntity.name)
    private readonly reviewModel: Model<ReviewEntity>,
  ) {}

  public async insert(doc: Partial<ReviewEntity>): Promise<ReviewEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.reviewModel.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ReviewMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.reviewModel.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("후기");
    }
  }

  public async deleteById(id: Types.ObjectId): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.reviewModel.deleteOne({ _id: id }, { session });
  }

  public findById(id: Types.ObjectId): Promise<ReviewEntity | null> {
    return this.reviewModel.findById(id).exec();
  }

  public async existsByPlacement(
    authorId: Types.ObjectId,
    placementType: string,
    placementRef: Types.ObjectId,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      authorId,
      placementType,
      placementRef,
    };
    const found = await this.reviewModel.exists(filter).exec();
    return found !== null;
  }

  public findByShelter(
    shelterId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<ReviewEntity[]> {
    return this.reviewModel
      .find({ shelterId, ...keysetFilter(cursorId) })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }

  public async summarizeByShelter(
    shelterId: Types.ObjectId,
  ): Promise<ShelterReputation> {
    const rows = await this.reviewModel
      .aggregate<{ _id: number; count: number }>([
        { $match: { shelterId } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ])
      .exec();

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    let total = 0;
    let sum = 0;
    for (const row of rows) {
      const star = row._id as 1 | 2 | 3 | 4 | 5;
      distribution[star] = row.count;
      total += row.count;
      sum += star * row.count;
    }

    return {
      shelterId: shelterId.toHexString(),
      reviewCount: total,
      average: total === 0 ? 0 : Math.round((sum / total) * 10) / 10,
      distribution,
    };
  }
}
