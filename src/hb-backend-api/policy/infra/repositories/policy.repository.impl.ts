import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { PolicyStatus } from "src/hb-backend-api/policy/domain/enums/policy-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocumentEntity } from "src/hb-backend-api/policy/domain/model/policy-document.entity";
import { PolicyRepository } from "src/hb-backend-api/policy/domain/repositories/policy.repository";

@Injectable()
export class PolicyRepositoryImpl implements PolicyRepository {
  constructor(
    @InjectModel(PolicyDocumentEntity.name)
    private readonly model: Model<PolicyDocumentEntity>,
  ) {}

  public async insert(
    doc: Partial<PolicyDocumentEntity>,
  ): Promise<PolicyDocumentEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.model.create([doc], { session });
    return created;
  }

  public async archivePublished(type: PolicyType): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateMany(
      { type, status: PolicyStatus.PUBLISHED },
      { $set: { status: PolicyStatus.ARCHIVED } },
      { session },
    );
  }

  public findCurrent(type: PolicyType): Promise<PolicyDocumentEntity | null> {
    return this.model.findOne({ type, status: PolicyStatus.PUBLISHED }).exec();
  }

  public findVersions(type: PolicyType): Promise<PolicyDocumentEntity[]> {
    return this.model.find({ type }).sort({ version: -1 }).exec();
  }

  public async maxVersion(type: PolicyType): Promise<number> {
    const latest = await this.model
      .findOne({ type })
      .sort({ version: -1 })
      .select("version")
      .exec();
    return latest?.version ?? 0;
  }
}
