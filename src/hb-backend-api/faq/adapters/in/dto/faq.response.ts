import { ApiProperty } from "@nestjs/swagger";
import { Faq } from "src/hb-backend-api/faq/domain/model/faq";

export class FaqResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  question: string;

  @ApiProperty()
  answer: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(faq: Faq): FaqResponse {
    const dto = new FaqResponse();
    dto.id = faq.getId.toString();
    dto.shelterId = faq.getShelterId.toString();
    dto.question = faq.getQuestion;
    dto.answer = faq.getAnswer;
    dto.order = faq.getOrder;
    dto.createdAt = faq.getCreatedAt;
    return dto;
  }
}
