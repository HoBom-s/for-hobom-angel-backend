import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { AnnouncementEntity } from "src/hb-backend-api/announcement/domain/model/announcement.entity";
import {
  AnnouncementMutablePatch,
  AnnouncementRepository,
} from "src/hb-backend-api/announcement/domain/repositories/announcement.repository";

@Injectable()
export class AnnouncementRepositoryImpl implements AnnouncementRepository {
  constructor(
    @InjectModel(AnnouncementEntity.name)
    private readonly announcementModel: Model<AnnouncementEntity>,
  ) {}

  public async insert(
    doc: Partial<AnnouncementEntity>,
  ): Promise<AnnouncementEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.announcementModel.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: AnnouncementMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.announcementModel.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("공지");
    }
  }

  public async deleteById(id: Types.ObjectId): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.announcementModel.deleteOne({ _id: id }, { session });
  }

  public findById(id: Types.ObjectId): Promise<AnnouncementEntity | null> {
    return this.announcementModel.findById(id).exec();
  }

  public findByShelter(
    shelterId: Types.ObjectId,
    limit: number,
  ): Promise<AnnouncementEntity[]> {
    return this.announcementModel
      .find({ shelterId })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
