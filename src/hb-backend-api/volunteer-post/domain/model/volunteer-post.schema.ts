import { SchemaFactory } from "@nestjs/mongoose";
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";

export const VolunteerPostSchema =
  SchemaFactory.createForClass(VolunteerPostEntity);

// The global feed sorts newest-first on the default `_id` index (no custom
// index needed). This one serves "an author's own posts".
VolunteerPostSchema.index({ authorId: 1, _id: -1 });
