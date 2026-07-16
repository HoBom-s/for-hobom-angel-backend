import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

@Schema({ collection: "volunteer_post_comments", timestamps: true })
export class VolunteerPostCommentEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "volunteer_posts" })
  public postId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public authorId: Types.ObjectId;

  @Prop({ required: true })
  public body: string;
}
