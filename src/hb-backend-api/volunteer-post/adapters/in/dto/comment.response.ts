import { ApiProperty } from "@nestjs/swagger";
import { VolunteerPostComment } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment";
import { CreateCommentResult } from "src/hb-backend-api/volunteer-post/domain/ports/in/comment-volunteer-post.use-case";

export class CommentResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;

  public static from(comment: VolunteerPostComment): CommentResponse {
    const dto = new CommentResponse();
    dto.id = comment.getId.toString();
    dto.postId = comment.getPostId.toString();
    dto.authorId = comment.getAuthorId.toString();
    dto.body = comment.getBody;
    dto.createdAt = comment.getCreatedAt;
    return dto;
  }
}

export class CreateCommentResponse {
  @ApiProperty()
  commentId: string;

  public static from(result: CreateCommentResult): CreateCommentResponse {
    const dto = new CreateCommentResponse();
    dto.commentId = result.commentId;
    return dto;
  }
}
