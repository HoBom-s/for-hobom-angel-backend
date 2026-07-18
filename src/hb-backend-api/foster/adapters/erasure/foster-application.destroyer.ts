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
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";

/**
 * APPLICATIONS. Purges the questionnaire answers from the subject's foster
 * applications, keeping the row (decision + dates) for the foster legal/safety
 * record. Idempotent.
 */
@Injectable()
export class FosterApplicationDestroyer extends Destroyer {
  public readonly key = "foster.applications";
  public readonly priority = 31;
  public readonly rule: RetentionRule = {
    category: DataCategory.APPLICATIONS,
    disposition: Disposition.ANONYMIZE,
    legalBasis:
      "foster legal/safety record kept; sensitive questionnaire answers purged",
  };

  constructor(
    @InjectModel(FosterApplicationEntity.name)
    private readonly model: Model<FosterApplicationEntity>,
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
