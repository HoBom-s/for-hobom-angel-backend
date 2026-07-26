import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import {
  UserAnonymizePatch,
  UserAuthzPatch,
  UserRepository,
} from "src/hb-backend-api/user/domain/repositories/user.repository";

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserEntity>,
  ) {}

  public async insert(doc: Partial<UserEntity>): Promise<UserEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.userModel.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: UserAuthzPatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.userModel.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("회원 정보");
    }
  }

  public findById(id: Types.ObjectId): Promise<UserEntity | null> {
    return this.userModel.findById(id).exec();
  }

  public findByNickname(nickname: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ nickname }).exec();
  }

  public findByEmail(email: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ email }).exec();
  }

  public findByShelter(
    shelterId: Types.ObjectId,
    limit: number,
  ): Promise<UserEntity[]> {
    return this.userModel
      .find({
        "shelterRoles.shelterId": shelterId,
        status: { $ne: UserStatus.WITHDRAWN },
      })
      .sort({ _id: 1 })
      .limit(limit)
      .exec();
  }

  public countByStatus(status: UserStatus): Promise<number> {
    return this.userModel.countDocuments({ status }).exec();
  }

  public countCreatedBetween(from: Date, to: Date): Promise<number> {
    return this.userModel
      .countDocuments({ createdAt: { $gte: from, $lt: to } })
      .exec();
  }

  public async anonymize(
    id: Types.ObjectId,
    patch: UserAnonymizePatch,
  ): Promise<number> {
    const session = MongoSessionContext.getSession();
    // Guard on realNameEnc so a re-run on an already-tombstoned row is a no-op.
    const result = await this.userModel.updateOne(
      { _id: id, realNameEnc: { $ne: patch.realNameEnc } },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    return result.modifiedCount;
  }

  public countUnanonymized(
    id: Types.ObjectId,
    tombstone: string,
  ): Promise<number> {
    return this.userModel
      .countDocuments({ _id: id, realNameEnc: { $ne: tombstone } })
      .exec();
  }

  public async findWithdrawnToPurge(
    now: Date,
    limit: number,
  ): Promise<Types.ObjectId[]> {
    const docs = await this.userModel
      .find({ status: UserStatus.WITHDRAWN, purgeAfter: { $lte: now } })
      .select("_id")
      .limit(limit)
      .exec();
    return docs.map((doc) => doc._id);
  }
}
