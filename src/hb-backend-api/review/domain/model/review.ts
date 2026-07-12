import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";
import { Rating } from "src/hb-backend-api/review/domain/model/vo/rating.vo";
import { ReviewId } from "src/hb-backend-api/review/domain/model/vo/review-id.vo";

const MAX_BODY_LENGTH = 2000;

/**
 * Review aggregate — a member's rating + write-up of a shelter, earned by a
 * concrete completed placement (adoption/foster). The (author, placement) pair
 * is the identity of the experience: one review per placement, enforced by the
 * service and a unique index. Editing is confined to rating/body; the anchor
 * (author, shelter, placement) is immutable.
 */
export class Review {
  private constructor(
    private readonly id: ReviewId,
    private readonly shelterId: ShelterId,
    private readonly authorId: UserId,
    private readonly placementType: PlacementType,
    private readonly placementRef: string,
    private rating: Rating,
    private body: string,
    private readonly createdAt: Date | null,
    private readonly version: number,
  ) {}

  public static write(params: {
    shelterId: ShelterId;
    authorId: UserId;
    placementType: PlacementType;
    placementRef: string;
    rating: Rating;
    body: string;
  }): Review {
    return new Review(
      ReviewId.generate(),
      params.shelterId,
      params.authorId,
      params.placementType,
      params.placementRef,
      params.rating,
      Review.cleanBody(params.body),
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: ReviewId;
    shelterId: ShelterId;
    authorId: UserId;
    placementType: PlacementType;
    placementRef: string;
    rating: Rating;
    body: string;
    createdAt: Date | null;
    version: number;
  }): Review {
    return new Review(
      params.id,
      params.shelterId,
      params.authorId,
      params.placementType,
      params.placementRef,
      params.rating,
      params.body,
      params.createdAt,
      params.version,
    );
  }

  /** Edit the caller's own review — only the rating and body may change. */
  public revise(rating: Rating, body: string): void {
    this.rating = rating;
    this.body = Review.cleanBody(body);
  }

  public isAuthoredBy(userId: UserId): boolean {
    return this.authorId.equals(userId);
  }

  private static cleanBody(body: string): string {
    const trimmed = body?.trim() ?? "";
    if (!trimmed) {
      throw new Error("후기 내용을 입력해 주세요.");
    }
    if (trimmed.length > MAX_BODY_LENGTH) {
      throw new Error(`후기는 ${MAX_BODY_LENGTH}자 이하로 작성해 주세요.`);
    }
    return trimmed;
  }

  public get getId(): ReviewId {
    return this.id;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getAuthorId(): UserId {
    return this.authorId;
  }
  public get getPlacementType(): PlacementType {
    return this.placementType;
  }
  public get getPlacementRef(): string {
    return this.placementRef;
  }
  public get getRating(): Rating {
    return this.rating;
  }
  public get getBody(): string {
    return this.body;
  }
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
  public get getVersion(): number {
    return this.version;
  }
}
