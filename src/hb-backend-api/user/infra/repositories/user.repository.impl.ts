import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import {
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
    patch: UserAuthzPatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.userModel.updateOne({ _id: id }, { $set: patch }, { session });
  }

  public findById(id: Types.ObjectId): Promise<UserEntity | null> {
    return this.userModel.findById(id).exec();
  }

  public findByNickname(nickname: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ nickname }).exec();
  }

  public findByCi(ci: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ ci }).exec();
  }
}
