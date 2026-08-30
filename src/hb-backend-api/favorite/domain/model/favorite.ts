import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { FavoriteId } from "src/hb-backend-api/favorite/domain/model/vo/favorite-id.vo";
import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * Favorite aggregate — a member's interest in an animal (찜) or shelter (팔로우).
 * Its only invariant is uniqueness of (user, target), enforced at add time and by
 * a unique index; the aggregate is intentionally small but modeled like the rest
 * for a consistent domain layer.
 */
export class Favorite {
  private constructor(
    private readonly id: FavoriteId,
    private readonly userId: UserId,
    private readonly targetType: FavoriteTargetType,
    private readonly targetRef: string,
    private readonly favoritedAt: Date | null,
  ) {}

  public static create(params: {
    userId: UserId;
    targetType: FavoriteTargetType;
    targetRef: string;
  }): Favorite {
    if (!params.targetRef?.trim()) {
      throw new InvalidInputError("찜/팔로우 대상이 필요해요.");
    }
    return new Favorite(
      FavoriteId.generate(),
      params.userId,
      params.targetType,
      params.targetRef.trim(),
      null,
    );
  }

  public static reconstitute(params: {
    id: FavoriteId;
    userId: UserId;
    targetType: FavoriteTargetType;
    targetRef: string;
    favoritedAt: Date | null;
  }): Favorite {
    return new Favorite(
      params.id,
      params.userId,
      params.targetType,
      params.targetRef,
      params.favoritedAt,
    );
  }

  public get getId(): FavoriteId {
    return this.id;
  }
  public get getUserId(): UserId {
    return this.userId;
  }
  public get getTargetType(): FavoriteTargetType {
    return this.targetType;
  }
  public get getTargetRef(): string {
    return this.targetRef;
  }
  public get getFavoritedAt(): Date | null {
    return this.favoritedAt;
  }
}
