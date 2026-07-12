import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";

export class SubmitReviewDto {
  @ApiProperty({ enum: PlacementType })
  @IsEnum(PlacementType)
  placementType: PlacementType;

  @ApiProperty({ description: "입양/임보 신청 id (완료된 배치)" })
  @IsMongoId()
  placementRef: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
