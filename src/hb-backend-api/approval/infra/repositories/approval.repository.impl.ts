import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalActionEntity } from "src/hb-backend-api/approval/domain/model/approval-action.entity";
import { ApprovalRequestEntity } from "src/hb-backend-api/approval/domain/model/approval-request.entity";
import {
  ApprovalDecisionPatch,
  ApprovalRepository,
} from "src/hb-backend-api/approval/domain/repositories/approval.repository";

@Injectable()
export class ApprovalRepositoryImpl implements ApprovalRepository {
  constructor(
    @InjectModel(ApprovalRequestEntity.name)
    private readonly requestModel: Model<ApprovalRequestEntity>,
    @InjectModel(ApprovalActionEntity.name)
    private readonly actionModel: Model<ApprovalActionEntity>,
  ) {}

  public async insertRequest(
    doc: Partial<ApprovalRequestEntity>,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.requestModel.create([doc], { session });
  }

  public async updateRequest(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ApprovalDecisionPatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.requestModel.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("승인 요청");
    }
  }

  public findRequestById(
    id: Types.ObjectId,
  ): Promise<ApprovalRequestEntity | null> {
    return this.requestModel.findById(id).exec();
  }

  public findPendingByTypeAndShelter(
    type: ApprovalType,
    shelterId: string,
    limit: number,
  ): Promise<ApprovalRequestEntity[]> {
    return this.requestModel
      .find({
        type,
        status: ApprovalStatus.PENDING,
        "context.shelterId": shelterId,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  public async insertAction(doc: Partial<ApprovalActionEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.actionModel.create([doc], { session });
  }
}
