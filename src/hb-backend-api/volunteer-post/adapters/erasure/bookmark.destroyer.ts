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
import { VolunteerPostBookmarkEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-bookmark.entity";

/**
 * ENGAGEMENT. Hard-deletes the subject's post bookmarks. Bookmarks are private
 * with no denormalized count, so no tally repair is needed. Idempotent.
 */
@Injectable()
export class BookmarkDestroyer extends Destroyer {
  public readonly key = "volunteer-post.bookmarks";
  public readonly priority = 21;
  public readonly rule: RetentionRule = {
    category: DataCategory.ENGAGEMENT,
    disposition: Disposition.HARD_DELETE,
    legalBasis: "pure preference; no lawful basis to retain",
  };

  constructor(
    @InjectModel(VolunteerPostBookmarkEntity.name)
    private readonly bookmarkModel: Model<VolunteerPostBookmarkEntity>,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const session = MongoSessionContext.getSession();
    const result = await this.bookmarkModel.deleteMany(
      { userId: new Types.ObjectId(subjectId) },
      { session },
    );
    return { affected: result.deletedCount ?? 0, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.bookmarkModel
      .countDocuments({ userId: new Types.ObjectId(subjectId) })
      .exec();
  }
}
