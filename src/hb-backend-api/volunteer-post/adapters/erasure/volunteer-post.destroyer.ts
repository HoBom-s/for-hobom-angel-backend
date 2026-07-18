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
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";

/**
 * SOCIAL. Clears the content blocks (text + inline image refs) of the subject's
 * volunteer posts, keeping the row + like/comment tallies; the author link
 * resolves to the anonymized user. (The image blobs themselves live in object
 * storage — their cleanup is a separate concern.) Idempotent.
 */
@Injectable()
export class VolunteerPostDestroyer extends Destroyer {
  public readonly key = "volunteer-post.posts";
  public readonly priority = 50;
  public readonly rule: RetentionRule = {
    category: DataCategory.SOCIAL,
    disposition: Disposition.ANONYMIZE,
    legalBasis: "post row + tallies kept; the subject's content purged",
    heavy: true,
  };

  constructor(
    @InjectModel(VolunteerPostEntity.name)
    private readonly model: Model<VolunteerPostEntity>,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateMany(
      { authorId: new Types.ObjectId(subjectId) },
      { $set: { content: [] } },
      { session },
    );
    return { affected: result.modifiedCount, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.model
      .countDocuments({
        authorId: new Types.ObjectId(subjectId),
        "content.0": { $exists: true },
      })
      .exec();
  }
}
