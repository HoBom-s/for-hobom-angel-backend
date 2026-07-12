import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMongoId } from "class-validator";
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";

export class AddFavoriteDto {
  @ApiProperty({ enum: FavoriteTargetType })
  @IsEnum(FavoriteTargetType)
  targetType: FavoriteTargetType;

  @ApiProperty({ description: "동물 id 또는 보호소 id" })
  @IsMongoId()
  targetRef: string;
}
