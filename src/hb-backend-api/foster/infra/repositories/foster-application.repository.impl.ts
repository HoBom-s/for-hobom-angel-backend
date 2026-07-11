import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";
import {
  FosterApplicationMutablePatch,
  FosterApplicationRepository,
} from "src/hb-backend-api/foster/domain/repositories/foster-application.repository";

@Injectable()
export class FosterApplicationRepositoryImpl implements FosterApplicationRepository {
  constructor(
    @InjectModel(FosterApplicationEntity.name)
    private readonly model: Model<FosterApplicationEntity>,
  ) {}

  public async insert(doc: Partial<FosterApplicationEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.create([doc], { session });
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: FosterApplicationMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("임시보호 신청");
    }
  }

  public findById(id: Types.ObjectId): Promise<FosterApplicationEntity | null> {
    return this.model.findById(id).exec();
  }
}
