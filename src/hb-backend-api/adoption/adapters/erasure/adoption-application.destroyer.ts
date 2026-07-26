import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import {
  Destroyer,
  DisposalResult,
} from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { RetentionRule } from "src/shared/erasure/retention-rule";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";

/**
 * APPLICATIONS. Purges the (sensitive) questionnaire answers from the subject's
 * adoption applications while keeping the row — the decision + dates stay for the
 * adoption legal/safety record; the applicant link resolves to the anonymized
 * user tombstone. Idempotent (a cleared row is a no-op on re-run).
 */
@Injectable()
export class AdoptionApplicationDestroyer extends Destroyer {
  public readonly key = "adoption.applications";
  public readonly priority = 30;
  public readonly rule: RetentionRule = {
    category: DataCategory.APPLICATIONS,
    disposition: Disposition.ANONYMIZE,
    legalBasis:
      "adoption legal/safety record kept; sensitive questionnaire answers purged",
  };

  constructor(
    @InjectModel(AdoptionApplicationEntity.name)
    private readonly model: Model<AdoptionApplicationEntity>,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateMany(
      { applicantId: new Types.ObjectId(subjectId) },
      { $set: { answers: [] } },
      { session },
    );
    return { affected: result.modifiedCount, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.model
      .countDocuments({
        applicantId: new Types.ObjectId(subjectId),
        "answers.0": { $exists: true },
      })
      .exec();
  }
}
