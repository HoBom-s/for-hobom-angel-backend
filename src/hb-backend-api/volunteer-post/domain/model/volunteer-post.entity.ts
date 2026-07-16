import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

@Schema({ collection: "volunteer_posts", timestamps: true })
export class VolunteerPostEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public authorId: Types.ObjectId;

  // Optional link to the reviewed event (opaque reference).
  @Prop({ type: Types.ObjectId, ref: "volunteer_events", default: null })
  public eventId?: Types.ObjectId | null;

  @Prop({ required: true })
  public body: string;

  @Prop({ type: [String], default: [] })
  public imageKeys: string[];

  // Denormalized like tally, maintained by atomic $inc on the like toggle.
  @Prop({ required: true, default: 0 })
  public likeCount: number;

  // Denormalized comment tally, maintained by atomic $inc on create/delete.
  @Prop({ required: true, default: 0 })
  public commentCount: number;

  @Prop({ required: true, default: 0 })
  public version: number;
}
