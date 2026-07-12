import { ApiProperty } from "@nestjs/swagger";
import { Announcement } from "src/hb-backend-api/announcement/domain/model/announcement";

export class AnnouncementResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  pinned: boolean;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(announcement: Announcement): AnnouncementResponse {
    const dto = new AnnouncementResponse();
    dto.id = announcement.getId.toString();
    dto.shelterId = announcement.getShelterId.toString();
    dto.authorId = announcement.getAuthorId.toString();
    dto.title = announcement.getTitle;
    dto.body = announcement.getBody;
    dto.pinned = announcement.isPinned;
    dto.createdAt = announcement.getCreatedAt;
    return dto;
  }
}
