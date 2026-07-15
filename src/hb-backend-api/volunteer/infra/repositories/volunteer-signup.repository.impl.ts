import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";
import {
  VolunteerSignupMutablePatch,
  VolunteerSignupRepository,
} from "src/hb-backend-api/volunteer/domain/repositories/volunteer-signup.repository";

@Injectable()
export class VolunteerSignupRepositoryImpl implements VolunteerSignupRepository {
  constructor(
    @InjectModel(VolunteerSignupEntity.name)
    private readonly model: Model<VolunteerSignupEntity>,
  ) {}

  public async insert(
    doc: Partial<VolunteerSignupEntity>,
  ): Promise<VolunteerSignupEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.model.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: VolunteerSignupMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("봉사 지원");
    }
  }

  public findById(id: Types.ObjectId): Promise<VolunteerSignupEntity | null> {
    return this.model.findById(id).exec();
  }

  public findLive(
    eventId: Types.ObjectId,
    volunteerId: Types.ObjectId,
  ): Promise<VolunteerSignupEntity | null> {
    return this.model
      .findOne({
        eventId,
        volunteerId,
        status: {
          $in: [VolunteerSignupStatus.PENDING, VolunteerSignupStatus.APPROVED],
        },
      })
      .exec();
  }

  public findByEvent(
    eventId: Types.ObjectId,
  ): Promise<VolunteerSignupEntity[]> {
    return this.model.find({ eventId }).sort({ _id: -1 }).exec();
  }
}
