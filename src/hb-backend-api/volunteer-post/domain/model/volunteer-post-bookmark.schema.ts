import { SchemaFactory } from "@nestjs/mongoose";
import { VolunteerPostBookmarkEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-bookmark.entity";

export const VolunteerPostBookmarkSchema = SchemaFactory.createForClass(
  VolunteerPostBookmarkEntity,
);

// One bookmark per (post, user); also serves "did this user save these posts".
VolunteerPostBookmarkSchema.index({ postId: 1, userId: 1 }, { unique: true });
// "My bookmarks", most recently saved first.
VolunteerPostBookmarkSchema.index({ userId: 1, _id: -1 });
