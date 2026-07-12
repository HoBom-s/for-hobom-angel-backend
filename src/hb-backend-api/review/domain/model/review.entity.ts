import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";

@Schema({ collection: "reviews", timestamps: true })
export class ReviewEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public authorId: Types.ObjectId;

  @Prop({ required: true, enum: PlacementType, type: String })
  public placementType: PlacementType;

  @Prop({ required: true, type: Types.ObjectId })
  public placementRef: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  public rating: number;

  @Prop({ required: true })
  public body: string;

  @Prop({ required: true, default: 0 })
  public version: number;
}
