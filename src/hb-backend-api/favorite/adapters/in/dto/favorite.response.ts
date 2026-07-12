import { ApiProperty } from "@nestjs/swagger";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { Favorite } from "src/hb-backend-api/favorite/domain/model/favorite";

export class FavoriteResponse {
  @ApiProperty({ enum: FavoriteTargetType })
  targetType: FavoriteTargetType;

  @ApiProperty()
  targetRef: string;

  @ApiProperty({ nullable: true })
  favoritedAt: Date | null;

  public static from(favorite: Favorite): FavoriteResponse {
    const dto = new FavoriteResponse();
    dto.targetType = favorite.getTargetType;
    dto.targetRef = favorite.getTargetRef;
    dto.favoritedAt = favorite.getFavoritedAt;
    return dto;
  }
}
