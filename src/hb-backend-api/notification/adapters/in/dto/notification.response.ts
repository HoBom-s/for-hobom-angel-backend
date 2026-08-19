import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationType } from "src/hb-backend-api/notification/domain/enums/notification-type.enum";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";

/** A single bell notification. `context`/`subjectRef` drive text + deep-link. */
export class NotificationResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: "대상 참조 (신청 id / 보호소 id 등)" })
  subjectRef: string;

  @ApiPropertyOptional({ type: Object, nullable: true })
  context: Record<string, unknown> | null;

  @ApiProperty({ description: "읽음 여부" })
  read: boolean;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  readAt: Date | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  createdAt: Date | null;

  public static from(notification: Notification): NotificationResponse {
    const dto = new NotificationResponse();
    dto.id = notification.getId.toString();
    dto.type = notification.getType;
    dto.subjectRef = notification.getSubjectRef;
    dto.context = notification.getContext;
    dto.read = notification.isRead();
    dto.readAt = notification.getReadAt;
    dto.createdAt = notification.getCreatedAt;
    return dto;
  }
}
