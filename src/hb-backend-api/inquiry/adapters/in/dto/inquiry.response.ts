import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { InquiryListItem } from "src/hb-backend-api/inquiry/domain/ports/in/inquiry-list-item";

/** The last message preview shown on an inbox row. */
class InquiryLastMessageResponse {
  @ApiProperty()
  body: string;

  @ApiProperty({ enum: MessageSenderRole })
  senderRole: MessageSenderRole;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  sentAt: Date | null;
}

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

  @ApiPropertyOptional({ nullable: true, description: "문의 대상 동물 이름" })
  animalName: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      "상대방 표시 이름 (내 문의=보호소명, 보호소 문의함=문의자 닉네임)",
  })
  counterpartName: string | null;

  @ApiPropertyOptional({ nullable: true, type: InquiryLastMessageResponse })
  lastMessage: InquiryLastMessageResponse | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  createdAt: Date | null;

  public static from(item: InquiryListItem): InquiryResponse {
    const { inquiry } = item;
    const dto = new InquiryResponse();
    dto.inquiryId = inquiry.getId.toString();
    dto.shelterId = inquiry.getShelterId.toString();
    dto.inquirerId = inquiry.getInquirerId.toString();
    dto.animalId = inquiry.getAnimalId ? inquiry.getAnimalId.toString() : null;
    dto.animalName = item.animalName;
    dto.counterpartName = item.counterpartName;
    dto.lastMessage = item.lastMessage
      ? {
          body: item.lastMessage.body,
          senderRole: item.lastMessage.senderRole,
          sentAt: item.lastMessage.sentAt,
        }
      : null;
    dto.createdAt = inquiry.getCreatedAt;
    return dto;
  }
}
