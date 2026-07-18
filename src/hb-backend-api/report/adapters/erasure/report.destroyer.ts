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
import { ReportEntity } from "src/hb-backend-api/report/domain/model/report.entity";

/**
 * MODERATION. Clears the free-text detail of reports the subject filed, keeping
 * the report itself (reason, status, resolution) as a moderation record; the
 * reporter link resolves to the anonymized user. Idempotent.
 */
@Injectable()
export class ReportDestroyer extends Destroyer {
  public readonly key = "report.reports";
  public readonly priority = 60;
  public readonly rule: RetentionRule = {
    category: DataCategory.MODERATION,
    disposition: Disposition.ANONYMIZE,
    legalBasis:
      "moderation record kept; the reporter's free-text detail purged",
  };

  constructor(
    @InjectModel(ReportEntity.name)
    private readonly model: Model<ReportEntity>,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateMany(
      { reporterId: new Types.ObjectId(subjectId) },
      { $set: { detail: "" } },
      { session },
    );
    return { affected: result.modifiedCount, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.model
      .countDocuments({
        reporterId: new Types.ObjectId(subjectId),
        detail: { $ne: "" },
      })
      .exec();
  }
}
