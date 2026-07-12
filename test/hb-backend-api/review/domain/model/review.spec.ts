import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";
import { Review } from "src/hb-backend-api/review/domain/model/review";
import { Rating } from "src/hb-backend-api/review/domain/model/vo/rating.vo";
import { ReviewId } from "src/hb-backend-api/review/domain/model/vo/review-id.vo";

const write = (overrides: { body?: string; rating?: number } = {}) =>
  Review.write({
    shelterId: new ShelterId(new Types.ObjectId()),
    authorId: UserId.generate(),
    placementType: PlacementType.ADOPTION,
    placementRef: new Types.ObjectId().toHexString(),
    rating: Rating.of(overrides.rating ?? 5),
    body: overrides.body ?? "좋은 보호소였어요.",
  });

describe("Review aggregate", () => {
  it("writes a review, trimming the body and starting at version 0", () => {
    const review = write({ body: "  친절했어요.  " });
    expect(review.getBody).toBe("친절했어요.");
    expect(review.getRating.raw).toBe(5);
    expect(review.getVersion).toBe(0);
  });

  it("rejects an empty body", () => {
    expect(() => write({ body: "   " })).toThrow("후기 내용");
  });

  it("rejects a body over 2000 chars", () => {
    expect(() => write({ body: "가".repeat(2001) })).toThrow("2000자");
  });

  it("revise updates only rating and body", () => {
    const review = write({ rating: 5, body: "처음 후기" });
    review.revise(Rating.of(2), "다시 생각해보니...");
    expect(review.getRating.raw).toBe(2);
    expect(review.getBody).toBe("다시 생각해보니...");
  });

  it("isAuthoredBy recognizes the author only", () => {
    const author = UserId.generate();
    const review = Review.reconstitute({
      id: ReviewId.generate(),
      shelterId: new ShelterId(new Types.ObjectId()),
      authorId: author,
      placementType: PlacementType.FOSTER,
      placementRef: new Types.ObjectId().toHexString(),
      rating: Rating.of(4),
      body: "임보 경험 좋았어요.",
      createdAt: null,
      version: 0,
    });
    expect(review.isAuthoredBy(author)).toBe(true);
    expect(review.isAuthoredBy(UserId.generate())).toBe(false);
  });
});
