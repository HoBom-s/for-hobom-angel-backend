import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import {
  AdoptionApplicationRepository,
  ApplicationMutablePatch,
} from "src/hb-backend-api/adoption/domain/repositories/adoption-application.repository";

@Injectable()
export class AdoptionApplicationRepositoryImpl implements AdoptionApplicationRepository {
  constructor(
    @InjectModel(AdoptionApplicationEntity.name)
    private readonly model: Model<AdoptionApplicationEntity>,
  ) {}

  public async insert(doc: Partial<AdoptionApplicationEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.create([doc], { session });
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ApplicationMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("입양 신청");
    }
  }

  public findById(
    id: Types.ObjectId,
  ): Promise<AdoptionApplicationEntity | null> {
    return this.model.findById(id).exec();
  }

  public findPageByShelter(
    shelterId: Types.ObjectId,
    status: AdoptionApplicationStatus | null,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<AdoptionApplicationEntity[]> {
    return this.findPage({ shelterId }, status, cursorId, limit);
  }

  public findPageByApplicant(
    applicantId: Types.ObjectId,
    status: AdoptionApplicationStatus | null,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<AdoptionApplicationEntity[]> {
    return this.findPage({ applicantId }, status, cursorId, limit);
  }

  private findPage(
    base: Record<string, unknown>,
    status: AdoptionApplicationStatus | null,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<AdoptionApplicationEntity[]> {
    const query: Record<string, unknown> = { ...base };
    if (status) {
      query.status = status;
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

  public countByApplicantAndStatus(
    applicantId: Types.ObjectId,
    status: AdoptionApplicationStatus,
  ): Promise<number> {
    return this.model.countDocuments({ applicantId, status }).exec();
  }

  public countByShelterAndStatus(
    shelterId: Types.ObjectId,
    status: AdoptionApplicationStatus,
  ): Promise<number> {
    return this.model.countDocuments({ shelterId, status }).exec();
  }

  public countByShelterAndStatusBetween(
    shelterId: Types.ObjectId,
    status: AdoptionApplicationStatus,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.model
      .countDocuments({ shelterId, status, updatedAt: { $gte: from, $lt: to } })
      .exec();
  }

  public countByStatus(status: AdoptionApplicationStatus): Promise<number> {
    return this.model.countDocuments({ status }).exec();
  }

  public countByStatusBetween(
    status: AdoptionApplicationStatus,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.model
      .countDocuments({ status, updatedAt: { $gte: from, $lt: to } })
      .exec();
  }
}
