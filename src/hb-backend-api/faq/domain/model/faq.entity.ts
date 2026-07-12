import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

@Schema({ collection: "shelter_faqs", timestamps: true })
export class FaqEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public authorId: Types.ObjectId;

  @Prop({ required: true })
  public question: string;

  @Prop({ required: true })
  public answer: string;

  @Prop({ required: true, default: 0 })
  public order: number;

  @Prop({ required: true, default: 0 })
  public version: number;
}
