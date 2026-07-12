import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { ReviewEntity } from "src/hb-backend-api/review/domain/model/review.entity";
import { Review } from "src/hb-backend-api/review/domain/model/review";
import { Rating } from "src/hb-backend-api/review/domain/model/vo/rating.vo";
import { ReviewId } from "src/hb-backend-api/review/domain/model/vo/review-id.vo";
import { ReviewMutablePatch } from "src/hb-backend-api/review/domain/repositories/review.repository";

/** Rehydrates a persisted document into the {@link Review} aggregate. */
export function toDomain(doc: ReviewEntity): Review {
  return Review.reconstitute({
    id: ReviewId.fromString(String(doc._id)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    authorId: UserId.fromString(String(doc.authorId)),
    placementType: doc.placementType,
    placementRef: String(doc.placementRef),
    rating: Rating.of(doc.rating),
    body: doc.body,
    createdAt: doc.createdAt ?? null,
    version: doc.version ?? 0,
  });
}

/** New-review insert document (version/timestamps default in the schema). */
export function toInsertDoc(review: Review): Partial<ReviewEntity> {
  return {
    _id: review.getId.raw,
    shelterId: review.getShelterId.raw,
    authorId: review.getAuthorId.raw,
    placementType: review.getPlacementType,
    placementRef: new Types.ObjectId(review.getPlacementRef),
    rating: review.getRating.raw,
    body: review.getBody,
  };
}

export function toMutablePatch(review: Review): ReviewMutablePatch {
  return {
    rating: review.getRating.raw,
    body: review.getBody,
  };
}
