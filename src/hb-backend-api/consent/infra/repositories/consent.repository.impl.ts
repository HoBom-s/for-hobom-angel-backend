import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { ConsentEntity } from "src/hb-backend-api/consent/domain/model/consent.entity";
import {
  ConsentPatch,
  ConsentRepository,
} from "src/hb-backend-api/consent/domain/repositories/consent.repository";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

@Injectable()
export class ConsentRepositoryImpl implements ConsentRepository {
  constructor(
    @InjectModel(ConsentEntity.name)
    private readonly model: Model<ConsentEntity>,
  ) {}

  public async insert(doc: Partial<ConsentEntity>): Promise<ConsentEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.model.create([doc], { session });
    return created;
  }

  public async update(id: Types.ObjectId, patch: ConsentPatch): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateOne({ _id: id }, { $set: patch }, { session });
  }

  public findByUser(userId: Types.ObjectId): Promise<ConsentEntity[]> {
    return this.model.find({ userId }).exec();
  }

  public findByUserAndType(
    userId: Types.ObjectId,
    policyType: PolicyType,
  ): Promise<ConsentEntity | null> {
    return this.model.findOne({ userId, policyType }).exec();
  }
}
