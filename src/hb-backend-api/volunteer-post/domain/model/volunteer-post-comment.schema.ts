import { SchemaFactory } from "@nestjs/mongoose";
import { VolunteerPostCommentEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment.entity";

export const VolunteerPostCommentSchema = SchemaFactory.createForClass(
  VolunteerPostCommentEntity,
);

// A post's comment thread, oldest first (keyset on _id ascending).
VolunteerPostCommentSchema.index({ postId: 1, _id: 1 });
