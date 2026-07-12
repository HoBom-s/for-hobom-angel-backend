import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

@Schema({ collection: "shelter_announcements", timestamps: true })
export class AnnouncementEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public authorId: Types.ObjectId;

  @Prop({ required: true })
  public title: string;

  @Prop({ required: true })
  public body: string;

  @Prop({ required: true, default: false })
  public pinned: boolean;

  @Prop({ required: true, default: 0 })
  public version: number;
}
