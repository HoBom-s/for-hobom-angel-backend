import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

/**
 * A member's bookmark (save) on a post — an anemic join record, unique per
 * (post, user). Private: there is no public count, only the owner's flag + list.
 */
@Schema({ collection: "volunteer_post_bookmarks", timestamps: true })
export class VolunteerPostBookmarkEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "volunteer_posts" })
  public postId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public userId: Types.ObjectId;
}
