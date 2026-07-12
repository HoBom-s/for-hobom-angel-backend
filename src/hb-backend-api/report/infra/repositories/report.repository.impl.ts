import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { ReportStatus } from "src/hb-backend-api/report/domain/enums/report-status.enum";
import { ReportEntity } from "src/hb-backend-api/report/domain/model/report.entity";
import {
  ReportMutablePatch,
  ReportRepository,
} from "src/hb-backend-api/report/domain/repositories/report.repository";

@Injectable()
export class ReportRepositoryImpl implements ReportRepository {
  constructor(
    @InjectModel(ReportEntity.name)
    private readonly model: Model<ReportEntity>,
  ) {}

  public async insert(doc: Partial<ReportEntity>): Promise<ReportEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.model.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ReportMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("신고");
    }
  }

  public findById(id: Types.ObjectId): Promise<ReportEntity | null> {
    return this.model.findById(id).exec();
  }

  public findPending(limit: number): Promise<ReportEntity[]> {
    return this.model
      .find({ status: ReportStatus.PENDING })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  }
}
