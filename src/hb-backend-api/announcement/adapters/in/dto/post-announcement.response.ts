import { ApiProperty } from "@nestjs/swagger";

export class PostAnnouncementResponse {
  @ApiProperty()
  announcementId: string;
}
