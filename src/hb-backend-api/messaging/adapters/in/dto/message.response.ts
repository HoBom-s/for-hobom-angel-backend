import { ApiProperty } from "@nestjs/swagger";
import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { Message } from "src/hb-backend-api/messaging/domain/model/message";

export class MessageResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty({ enum: MessageSenderRole })
  senderRole: MessageSenderRole;

  @ApiProperty()
  body: string;

  @ApiProperty({ nullable: true })
  sentAt: Date | null;

  public static from(message: Message): MessageResponse {
    const dto = new MessageResponse();
    dto.id = message.getId.toString();
    dto.senderId = message.getSenderId.toString();
    dto.senderRole = message.getSenderRole;
    dto.body = message.getBody;
    dto.sentAt = message.getSentAt;
    return dto;
  }
}
