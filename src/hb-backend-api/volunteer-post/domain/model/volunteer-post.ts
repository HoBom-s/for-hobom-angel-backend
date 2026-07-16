import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { PostContent } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-content";
import { PostBlockInput } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";

/**
 * A volunteer's review/promo post ("봉사 후기 홍보글", §05). Member-authored
 * content about a specific shelter (`shelterId`); `eventId` optionally pins it to
 * one of that shelter's events. The body is a {@link PostContent} block list so
 * images sit inline. The post is its own consistency boundary — only the author
 * may remove it (a platform operator may moderate).
 */
export class VolunteerPost {
  private constructor(
    private readonly id: VolunteerPostId,
    private readonly authorId: UserId,
    private readonly shelterId: ShelterId,
    private readonly eventId: string | null,
    private readonly content: PostContent,
    private readonly likeCount: number,
    private readonly commentCount: number,
    private readonly createdAt: Date | null,
    private readonly version: number,
  ) {}

  public static write(params: {
    authorId: UserId;
    shelterId: ShelterId;
    eventId?: string | null;
    content: PostBlockInput[];
  }): VolunteerPost {
    return new VolunteerPost(
      VolunteerPostId.generate(),
      params.authorId,
      params.shelterId,
      params.eventId?.trim() || null,
      PostContent.of(params.content),
      0,
      0,
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: VolunteerPostId;
    authorId: UserId;
    shelterId: ShelterId;
    eventId: string | null;
    content: PostContent;
    likeCount: number;
    commentCount: number;
    createdAt: Date | null;
    version: number;
  }): VolunteerPost {
    return new VolunteerPost(
      params.id,
      params.authorId,
      params.shelterId,
      params.eventId,
      params.content,
      params.likeCount,
      params.commentCount,
      params.createdAt,
      params.version,
    );
  }

  public isAuthoredBy(userId: UserId): boolean {
    return this.authorId.equals(userId);
  }

  public get getId(): VolunteerPostId {
    return this.id;
  }
  public get getAuthorId(): UserId {
    return this.authorId;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getEventId(): string | null {
    return this.eventId;
  }
  public get getContent(): PostContent {
    return this.content;
  }
  /** The attached-image manifest (object keys of every image block). */
  public get getImageKeys(): string[] {
    return this.content.getImageKeys;
  }
  public get getLikeCount(): number {
    return this.likeCount;
  }
  public get getCommentCount(): number {
    return this.commentCount;
  }
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
  public get getVersion(): number {
    return this.version;
  }
}
