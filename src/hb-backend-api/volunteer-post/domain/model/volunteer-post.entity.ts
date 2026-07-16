import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { PostBlockType } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";

export interface PostBlockDoc {
  type: PostBlockType;
  text?: string | null;
  imageKey?: string | null;
  caption?: string | null;
}

@Schema({ collection: "volunteer_posts", timestamps: true })
export class VolunteerPostEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public authorId: Types.ObjectId;

  // The shelter this review is about.
  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  // Optional link to a specific event of that shelter (opaque reference).
  @Prop({ type: Types.ObjectId, ref: "volunteer_events", default: null })
  public eventId?: Types.ObjectId | null;

  // Ordered body blocks (TEXT / IMAGE), so images sit inline.
  @Prop({
    type: [
      {
        type: { type: String, enum: PostBlockType },
        text: { type: String, default: null },
        imageKey: { type: String, default: null },
        caption: { type: String, default: null },
      },
    ],
    default: [],
  })
  public content: PostBlockDoc[];

  // Denormalized like tally, maintained by atomic $inc on the like toggle.
  @Prop({ required: true, default: 0 })
  public likeCount: number;

  // Denormalized comment tally, maintained by atomic $inc on create/delete.
  @Prop({ required: true, default: 0 })
  public commentCount: number;

  @Prop({ required: true, default: 0 })
  public version: number;
}
