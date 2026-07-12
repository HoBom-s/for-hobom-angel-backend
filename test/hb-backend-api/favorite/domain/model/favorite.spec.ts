import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";

describe("Favorite", () => {
  it("creates with a trimmed target and no favoritedAt until stored", () => {
    const favorite = Favorite.create({
      userId: UserId.generate(),
      targetType: FavoriteTargetType.ANIMAL,
      targetRef: "  animal-1  ",
    });
    expect(favorite.getTargetType).toBe(FavoriteTargetType.ANIMAL);
    expect(favorite.getTargetRef).toBe("animal-1");
    expect(favorite.getFavoritedAt).toBeNull();
  });

  it("rejects an empty target", () => {
    expect(() =>
      Favorite.create({
        userId: UserId.generate(),
        targetType: FavoriteTargetType.SHELTER,
        targetRef: "   ",
      }),
    ).toThrow("대상");
  });
});
