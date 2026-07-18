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
import { VolunteerPostCommentEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment.entity";

/**
 * SOCIAL. Tombstones the body of the subject's post comments, keeping the row so
 * the thread's comment tally holds; the author link resolves to the anonymized
 * user. Idempotent.
 */
@Injectable()
export class VolunteerPostCommentDestroyer extends Destroyer {
  public readonly key = "volunteer-post.comments";
  public readonly priority = 55;
  public readonly rule: RetentionRule = {
    category: DataCategory.SOCIAL,
    disposition: Disposition.ANONYMIZE,
    legalBasis: "comment tally kept; the subject's comment text purged",
    heavy: true,
  };

  constructor(
    @InjectModel(VolunteerPostCommentEntity.name)
    private readonly model: Model<VolunteerPostCommentEntity>,
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
