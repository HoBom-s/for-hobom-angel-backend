import { ApiProperty } from "@nestjs/swagger";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";

export class VolunteerPostResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ nullable: true, description: "연결된 봉사 일정 ID" })
  eventId: string | null;

  @ApiProperty()
  body: string;

  @ApiProperty({ type: [String] })
  imageKeys: string[];

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(post: VolunteerPost): VolunteerPostResponse {
    const dto = new VolunteerPostResponse();
    dto.id = post.getId.toString();
    dto.authorId = post.getAuthorId.toString();
    dto.eventId = post.getEventId;
    dto.body = post.getBody;
    dto.imageKeys = post.getImageKeys;
    dto.createdAt = post.getCreatedAt;
    return dto;
  }
}
