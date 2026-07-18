import { ApiProperty } from "@nestjs/swagger";

export class SubmitReviewResponse {
  @ApiProperty()
  reviewId: string;
}
