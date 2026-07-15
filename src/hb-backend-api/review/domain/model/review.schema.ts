import { SchemaFactory } from "@nestjs/mongoose";
import { ReviewEntity } from "src/hb-backend-api/review/domain/model/review.entity";

export const ReviewSchema = SchemaFactory.createForClass(ReviewEntity);

// One review per completed placement (the anti-fake-review guard).
ReviewSchema.index(
  { authorId: 1, placementType: 1, placementRef: 1 },
  { unique: true },
);
// A shelter's reviews, newest first (listing) + reputation aggregation.
ReviewSchema.index({ shelterId: 1, createdAt: -1 });
