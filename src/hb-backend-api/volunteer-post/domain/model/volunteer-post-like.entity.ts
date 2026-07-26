import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

/**
 * A member's like on a post — an anemic join record (like a favorite), unique
 * per (post, user). No invariants beyond that uniqueness.
 */
@Schema({ collection: "volunteer_post_likes", timestamps: true })
export class VolunteerPostLikeEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "volunteer_posts" })
  public postId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public userId: Types.ObjectId;
}
