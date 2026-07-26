import { SchemaFactory } from "@nestjs/mongoose";
import { VolunteerPostLikeEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-like.entity";

export const VolunteerPostLikeSchema = SchemaFactory.createForClass(
  VolunteerPostLikeEntity,
);

// One like per (post, user); also serves "did this user like these posts".
VolunteerPostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
