import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

@Schema({ collection: "inquiries", timestamps: true })
export class InquiryEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public inquirerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "animals", default: null })
  public animalId: Types.ObjectId | null;
}
