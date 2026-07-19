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
import { FavoriteEntity } from "src/hb-backend-api/favorite/domain/model/favorite.entity";

/**
 * ENGAGEMENT. Hard-deletes the subject's favorites/follows. Favorites carry no
 * denormalized count, so no tally repair is needed. Idempotent.
 */
@Injectable()
export class FavoriteDestroyer extends Destroyer {
  public readonly key = "favorite.favorites";
  public readonly priority = 22;
  public readonly rule: RetentionRule = {
    category: DataCategory.ENGAGEMENT,
    disposition: Disposition.HARD_DELETE,
    legalBasis: "pure preference; no lawful basis to retain",
  };

  constructor(
    @InjectModel(FavoriteEntity.name)
    private readonly favoriteModel: Model<FavoriteEntity>,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const session = MongoSessionContext.getSession();
    const result = await this.favoriteModel.deleteMany(
      { userId: new Types.ObjectId(subjectId) },
      { session },
    );
    return { affected: result.deletedCount ?? 0, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.favoriteModel
      .countDocuments({ userId: new Types.ObjectId(subjectId) })
      .exec();
  }
}
