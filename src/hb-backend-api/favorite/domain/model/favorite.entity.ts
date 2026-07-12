import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";

/**
 * A member's favorite — an anemic join record (like the outbox), not a rich
 * aggregate: it has no invariants beyond uniqueness of (user, target).
 */
@Schema({ collection: "favorites", timestamps: true })
export class FavoriteEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public userId: Types.ObjectId;

  @Prop({ required: true, enum: FavoriteTargetType, type: String })
  public targetType: FavoriteTargetType;

  @Prop({ required: true })
  public targetRef: string;
}
