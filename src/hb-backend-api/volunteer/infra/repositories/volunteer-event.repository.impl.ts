import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerEventEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";
import {
  VolunteerEventMutablePatch,
  VolunteerEventRepository,
} from "src/hb-backend-api/volunteer/domain/repositories/volunteer-event.repository";

@Injectable()
export class VolunteerEventRepositoryImpl implements VolunteerEventRepository {
  constructor(
    @InjectModel(VolunteerEventEntity.name)
    private readonly model: Model<VolunteerEventEntity>,
  ) {}

  public async insert(
    doc: Partial<VolunteerEventEntity>,
  ): Promise<VolunteerEventEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.model.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: VolunteerEventMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("봉사 일정");
    }
  }

  public findById(id: Types.ObjectId): Promise<VolunteerEventEntity | null> {
    return this.model.findById(id).exec();
  }

  public findByIds(ids: Types.ObjectId[]): Promise<VolunteerEventEntity[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.model.find({ _id: { $in: ids } }).exec();
  }

  public findByShelterId(
    shelterId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerEventEntity[]> {
    const query = cursorId
      ? { shelterId, _id: { $lt: cursorId } }
      : { shelterId };
    return this.model
      .find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }

  public findUpcoming(
    now: Date,
    limit: number,
  ): Promise<VolunteerEventEntity[]> {
    return this.model
      .find({ status: VolunteerEventStatus.OPEN, startAt: { $gt: now } })
      .sort({ startAt: 1 })
      .limit(limit)
      .exec();
  }

  public findExpiredOpen(
    now: Date,
    limit: number,
  ): Promise<VolunteerEventEntity[]> {
    return this.model
      .find({ status: VolunteerEventStatus.OPEN, endAt: { $lt: now } })
      .sort({ endAt: 1 })
      .limit(limit)
      .exec();
  }
}
