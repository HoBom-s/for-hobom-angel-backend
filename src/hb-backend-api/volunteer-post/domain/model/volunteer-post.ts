import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

const MAX_BODY_LENGTH = 5000;
const MAX_IMAGES = 10;

/**
 * A volunteer's review/promo post ("봉사 후기 홍보글", §05). Member-authored
 * content: the post itself is the consistency boundary and only its author may
 * remove it (a platform operator may moderate). `eventId` optionally links the
 * post to the volunteer event it reviews — stored as an opaque reference.
 */
export class VolunteerPost {
  private constructor(
    private readonly id: VolunteerPostId,
    private readonly authorId: UserId,
    private readonly eventId: string | null,
    private body: string,
    private imageKeys: string[],
    private readonly likeCount: number,
    private readonly createdAt: Date | null,
    private readonly version: number,
  ) {}

  public static write(params: {
    authorId: UserId;
    eventId?: string | null;
    body: string;
    imageKeys?: string[];
  }): VolunteerPost {
    return new VolunteerPost(
      VolunteerPostId.generate(),
      params.authorId,
      params.eventId?.trim() || null,
      VolunteerPost.cleanBody(params.body),
      VolunteerPost.cleanImages(params.imageKeys ?? []),
      0,
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: VolunteerPostId;
    authorId: UserId;
    eventId: string | null;
    body: string;
    imageKeys: string[];
    likeCount: number;
    createdAt: Date | null;
    version: number;
  }): VolunteerPost {
    return new VolunteerPost(
      params.id,
      params.authorId,
      params.eventId,
      params.body,
      params.imageKeys,
      params.likeCount,
      params.createdAt,
      params.version,
    );
  }

  public isAuthoredBy(userId: UserId): boolean {
    return this.authorId.equals(userId);
  }

  private static cleanBody(body: string): string {
    const trimmed = body?.trim();
    if (!trimmed) {
      throw new Error("후기 내용이 필요해요.");
    }
    if (trimmed.length > MAX_BODY_LENGTH) {
      throw new Error(`후기는 ${MAX_BODY_LENGTH}자까지 쓸 수 있어요.`);
    }
    return trimmed;
  }

  private static cleanImages(imageKeys: string[]): string[] {
    if (imageKeys.length > MAX_IMAGES) {
      throw new Error(`이미지는 최대 ${MAX_IMAGES}장까지예요.`);
    }
    return [...imageKeys];
  }

  public get getId(): VolunteerPostId {
    return this.id;
  }
  public get getAuthorId(): UserId {
    return this.authorId;
  }
  public get getEventId(): string | null {
    return this.eventId;
  }
  public get getBody(): string {
    return this.body;
  }
  public get getImageKeys(): string[] {
    return [...this.imageKeys];
  }
  public get getLikeCount(): number {
    return this.likeCount;
  }
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
  public get getVersion(): number {
    return this.version;
  }
}
