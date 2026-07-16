import { ApiProperty } from "@nestjs/swagger";
import { VolunteerFeedItem } from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";

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

  @ApiProperty({ description: "좋아요 수" })
  likeCount: number;

  @ApiProperty({ description: "댓글 수" })
  commentCount: number;

  @ApiProperty({ description: "내가 좋아요를 눌렀는지" })
  liked: boolean;

  @ApiProperty({ description: "내가 저장(북마크)했는지" })
  bookmarked: boolean;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(item: VolunteerFeedItem): VolunteerPostResponse {
    const dto = new VolunteerPostResponse();
    dto.id = item.post.getId.toString();
    dto.authorId = item.post.getAuthorId.toString();
    dto.eventId = item.post.getEventId;
    dto.body = item.post.getBody;
    dto.imageKeys = item.post.getImageKeys;
    dto.likeCount = item.post.getLikeCount;
    dto.commentCount = item.post.getCommentCount;
    dto.liked = item.liked;
    dto.bookmarked = item.bookmarked;
    dto.createdAt = item.post.getCreatedAt;
    return dto;
  }
}
