import { ApiProperty } from "@nestjs/swagger";
import { VolunteerFeedItem } from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";
import {
  PostBlock,
  PostBlockType,
} from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";

export class PostBlockResponse {
  @ApiProperty({ enum: PostBlockType })
  type: PostBlockType;

  @ApiProperty({ nullable: true })
  text: string | null;

  @ApiProperty({ nullable: true })
  imageKey: string | null;

  @ApiProperty({ nullable: true })
  caption: string | null;

  public static from(block: PostBlock): PostBlockResponse {
    const dto = new PostBlockResponse();
    dto.type = block.type;
    dto.text = block.type === PostBlockType.TEXT ? block.text : null;
    dto.imageKey = block.type === PostBlockType.IMAGE ? block.imageKey : null;
    dto.caption = block.type === PostBlockType.IMAGE ? block.caption : null;
    return dto;
  }
}

export class VolunteerPostResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ description: "후기 대상 보호소 ID" })
  shelterId: string;

  @ApiProperty({ nullable: true, description: "연결된 봉사 일정 ID" })
  eventId: string | null;

  @ApiProperty({
    type: [PostBlockResponse],
    description: "본문 블록 (순서대로)",
  })
  content: PostBlockResponse[];

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
    dto.shelterId = item.post.getShelterId.toString();
    dto.eventId = item.post.getEventId;
    dto.content = item.post.getContent.getBlocks.map((block) =>
      PostBlockResponse.from(block),
    );
    dto.likeCount = item.post.getLikeCount;
    dto.commentCount = item.post.getCommentCount;
    dto.liked = item.liked;
    dto.bookmarked = item.bookmarked;
    dto.createdAt = item.post.getCreatedAt;
    return dto;
  }
}
