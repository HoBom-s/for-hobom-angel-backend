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
import { VolunteerPostLikeEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-like.entity";
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";

/**
 * ENGAGEMENT. Hard-deletes the subject's post likes (a pure preference — no
 * lawful basis to keep), and repairs each affected post's denormalized
 * `likeCount` so tallies don't drift. One like per (post, user), so each post is
 * decremented by exactly one. Idempotent: a re-run finds no likes and does
 * nothing. Heavy (a user can like many posts) → its own transaction, so the
 * decrement and the delete commit atomically.
 */
@Injectable()
export class LikeDestroyer extends Destroyer {
  public readonly key = "volunteer-post.likes";
  public readonly priority = 20;
  public readonly rule: RetentionRule = {
    category: DataCategory.ENGAGEMENT,
    disposition: Disposition.HARD_DELETE,
    legalBasis: "pure preference; no lawful basis to retain",
    heavy: true,
  };

  constructor(
    @InjectModel(VolunteerPostLikeEntity.name)
    private readonly likeModel: Model<VolunteerPostLikeEntity>,
    @InjectModel(VolunteerPostEntity.name)
    private readonly postModel: Model<VolunteerPostEntity>,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const session = MongoSessionContext.getSession();
    const userId = new Types.ObjectId(subjectId);

    const likes = await this.likeModel
      .find({ userId })
      .select("postId")
      .session(session ?? null)
      .exec();
    if (likes.length === 0) {
      return { affected: 0, retained: 0 };
    }

    const postIds = likes.map((like) => like.postId);
    await this.postModel.updateMany(
      { _id: { $in: postIds } },
      { $inc: { likeCount: -1 } },
      { session },
    );
    const result = await this.likeModel.deleteMany({ userId }, { session });
    return { affected: result.deletedCount ?? 0, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.likeModel
      .countDocuments({ userId: new Types.ObjectId(subjectId) })
      .exec();
  }
}
