import { ApiProperty } from "@nestjs/swagger";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";
import { Review } from "src/hb-backend-api/review/domain/model/review";

export class ReviewResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ enum: PlacementType })
  placementType: PlacementType;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  body: string;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(review: Review): ReviewResponse {
    const dto = new ReviewResponse();
    dto.id = review.getId.toString();
    dto.shelterId = review.getShelterId.toString();
    dto.authorId = review.getAuthorId.toString();
    dto.placementType = review.getPlacementType;
    dto.rating = review.getRating.raw;
    dto.body = review.getBody;
    dto.createdAt = review.getCreatedAt;
    return dto;
  }
}
