import { ApiProperty } from "@nestjs/swagger";

export class PostFaqResponse {
  @ApiProperty()
  faqId: string;
}
