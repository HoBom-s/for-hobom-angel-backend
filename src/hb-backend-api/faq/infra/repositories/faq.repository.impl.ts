import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { FaqEntity } from "src/hb-backend-api/faq/domain/model/faq.entity";
import {
  FaqMutablePatch,
  FaqRepository,
} from "src/hb-backend-api/faq/domain/repositories/faq.repository";

@Injectable()
export class FaqRepositoryImpl implements FaqRepository {
  constructor(
    @InjectModel(FaqEntity.name)
    private readonly faqModel: Model<FaqEntity>,
  ) {}

  public async insert(doc: Partial<FaqEntity>): Promise<FaqEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.faqModel.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: FaqMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.faqModel.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("FAQ");
    }
  }

  public async deleteById(id: Types.ObjectId): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.faqModel.deleteOne({ _id: id }, { session });
  }

  public findById(id: Types.ObjectId): Promise<FaqEntity | null> {
    return this.faqModel.findById(id).exec();
  }

  public findByShelter(
    shelterId: Types.ObjectId,
    limit: number,
  ): Promise<FaqEntity[]> {
    return this.faqModel
      .find({ shelterId })
      .sort({ order: 1, createdAt: 1 })
      .limit(limit)
      .exec();
  }
}
