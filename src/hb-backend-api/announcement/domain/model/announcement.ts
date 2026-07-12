import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AnnouncementId } from "src/hb-backend-api/announcement/domain/model/vo/announcement-id.vo";

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 10000;

/**
 * Announcement aggregate — a notice a shelter publishes to its page (공지사항).
 * Shelter-owned content: the shelter is the consistency boundary, and any of its
 * staff may edit or remove it (authorship is recorded, not an edit gate).
 * `pinned` floats a notice to the top of the list.
 */
export class Announcement {
  private constructor(
    private readonly id: AnnouncementId,
    private readonly shelterId: ShelterId,
    private readonly authorId: UserId,
    private title: string,
    private body: string,
    private pinned: boolean,
    private readonly createdAt: Date | null,
    private readonly version: number,
  ) {}

  public static post(params: {
    shelterId: ShelterId;
    authorId: UserId;
    title: string;
    body: string;
    pinned: boolean;
  }): Announcement {
    return new Announcement(
      AnnouncementId.generate(),
      params.shelterId,
      params.authorId,
      Announcement.cleanTitle(params.title),
      Announcement.cleanBody(params.body),
      params.pinned,
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: AnnouncementId;
    shelterId: ShelterId;
    authorId: UserId;
    title: string;
    body: string;
    pinned: boolean;
    createdAt: Date | null;
    version: number;
  }): Announcement {
    return new Announcement(
      params.id,
      params.shelterId,
      params.authorId,
      params.title,
      params.body,
      params.pinned,
      params.createdAt,
      params.version,
    );
  }

  /** Edit the notice in place (title/body/pin state). */
  public edit(params: { title: string; body: string; pinned: boolean }): void {
    this.title = Announcement.cleanTitle(params.title);
    this.body = Announcement.cleanBody(params.body);
    this.pinned = params.pinned;
  }

  private static cleanTitle(title: string): string {
    const trimmed = title?.trim() ?? "";
    if (!trimmed) {
      throw new Error("공지 제목을 입력해 주세요.");
    }
    if (trimmed.length > MAX_TITLE_LENGTH) {
      throw new Error(
        `공지 제목은 ${MAX_TITLE_LENGTH}자 이하로 작성해 주세요.`,
      );
    }
    return trimmed;
  }

  private static cleanBody(body: string): string {
    const trimmed = body?.trim() ?? "";
    if (!trimmed) {
      throw new Error("공지 내용을 입력해 주세요.");
    }
    if (trimmed.length > MAX_BODY_LENGTH) {
      throw new Error(`공지 내용은 ${MAX_BODY_LENGTH}자 이하로 작성해 주세요.`);
    }
    return trimmed;
  }

  public get getId(): AnnouncementId {
    return this.id;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getAuthorId(): UserId {
    return this.authorId;
  }
  public get getTitle(): string {
    return this.title;
  }
  public get getBody(): string {
    return this.body;
  }
  public get isPinned(): boolean {
    return this.pinned;
  }
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
  public get getVersion(): number {
    return this.version;
  }
}
