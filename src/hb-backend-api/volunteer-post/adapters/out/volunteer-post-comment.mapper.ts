import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostComment } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment";
import { VolunteerPostCommentEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment.entity";
import { VolunteerPostCommentId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-comment-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

export function toDomain(
  doc: VolunteerPostCommentEntity,
): VolunteerPostComment {
  return VolunteerPostComment.reconstitute({
    id: VolunteerPostCommentId.fromString(String(doc._id)),
    postId: VolunteerPostId.fromString(String(doc.postId)),
    authorId: UserId.fromString(String(doc.authorId)),
    body: doc.body,
    createdAt: doc.createdAt ?? null,
  });
}

export function toInsertDoc(
  comment: VolunteerPostComment,
): Partial<VolunteerPostCommentEntity> {
  return {
    _id: comment.getId.raw,
    postId: comment.getPostId.raw,
    authorId: comment.getAuthorId.raw,
    body: comment.getBody,
  };
}
