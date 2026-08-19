import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";

/** An inquiry thread summary for the "내 문의" / 보호소 문의함 lists. */
export class InquiryResponse {
  @ApiProperty()
  inquiryId: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  inquirerId: string;

  @ApiPropertyOptional({ nullable: true, description: "문의 대상 동물 id" })
  animalId: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  createdAt: Date | null;

  public static from(inquiry: Inquiry): InquiryResponse {
    const dto = new InquiryResponse();
    dto.inquiryId = inquiry.getId.toString();
    dto.shelterId = inquiry.getShelterId.toString();
    dto.inquirerId = inquiry.getInquirerId.toString();
    dto.animalId = inquiry.getAnimalId ? inquiry.getAnimalId.toString() : null;
    dto.createdAt = inquiry.getCreatedAt;
    return dto;
  }
}
