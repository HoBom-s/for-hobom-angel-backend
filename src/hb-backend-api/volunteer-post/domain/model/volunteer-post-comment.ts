import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { VolunteerPostCommentId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-comment-id.vo";

const MAX_BODY_LENGTH = 1000;

/**
 * A comment on a volunteer post (§05). Member-authored; only its author (or a
 * platform operator, for moderation) may remove it. The post owns the
 * denormalized commentCount that create/delete drive.
 */
export class VolunteerPostComment {
  private constructor(
    private readonly id: VolunteerPostCommentId,
    private readonly postId: VolunteerPostId,
    private readonly authorId: UserId,
    private body: string,
    private readonly createdAt: Date | null,
  ) {}

  public static write(params: {
    postId: VolunteerPostId;
    authorId: UserId;
    body: string;
  }): VolunteerPostComment {
    return new VolunteerPostComment(
      VolunteerPostCommentId.generate(),
      params.postId,
      params.authorId,
      VolunteerPostComment.cleanBody(params.body),
      null,
    );
  }

  public static reconstitute(params: {
    id: VolunteerPostCommentId;
    postId: VolunteerPostId;
    authorId: UserId;
    body: string;
    createdAt: Date | null;
  }): VolunteerPostComment {
    return new VolunteerPostComment(
      params.id,
      params.postId,
      params.authorId,
      params.body,
      params.createdAt,
    );
  }

  public isAuthoredBy(userId: UserId): boolean {
    return this.authorId.equals(userId);
  }

  private static cleanBody(body: string): string {
    const trimmed = body?.trim();
    if (!trimmed) {
      throw new Error("댓글 내용이 필요해요.");
    }
    if (trimmed.length > MAX_BODY_LENGTH) {
      throw new Error(`댓글은 ${MAX_BODY_LENGTH}자까지 쓸 수 있어요.`);
    }
    return trimmed;
  }

  public get getId(): VolunteerPostCommentId {
    return this.id;
  }
  public get getPostId(): VolunteerPostId {
    return this.postId;
  }
  public get getAuthorId(): UserId {
    return this.authorId;
  }
  public get getBody(): string {
    return this.body;
  }
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
}
