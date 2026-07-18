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
import { ERASED_TEXT } from "src/shared/erasure/tombstone";
import { ReviewEntity } from "src/hb-backend-api/review/domain/model/review.entity";

/**
 * SOCIAL. Tombstones the body of the subject's reviews, keeping the row (rating +
 * placement) so a shelter's reputation aggregate is unaffected; the author link
 * resolves to the anonymized user. Idempotent.
 */
@Injectable()
export class ReviewDestroyer extends Destroyer {
  public readonly key = "review.reviews";
  public readonly priority = 45;
  public readonly rule: RetentionRule = {
    category: DataCategory.SOCIAL,
    disposition: Disposition.ANONYMIZE,
    legalBasis: "reputation aggregate kept; the subject's review text purged",
    heavy: true,
  };

  constructor(
    @InjectModel(ReviewEntity.name)
    private readonly model: Model<ReviewEntity>,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateMany(
      { authorId: new Types.ObjectId(subjectId) },
      { $set: { body: ERASED_TEXT } },
      { session },
    );
    return { affected: result.modifiedCount, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.model
      .countDocuments({
        authorId: new Types.ObjectId(subjectId),
        body: { $ne: ERASED_TEXT },
      })
      .exec();
  }
}
