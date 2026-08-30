import { PolicyStatus } from "src/hb-backend-api/policy/domain/enums/policy-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * A legal-document version aggregate. Versions are immutable once published; an
 * edit is a new version (so consent can bind to exact text). The only state
 * transition is PUBLISHED → ARCHIVED, when a newer version supersedes it.
 */
export class PolicyDocument {
  private constructor(
    private readonly id: string | null,
    private readonly type: PolicyType,
    private readonly version: number,
    private readonly title: string,
    private readonly content: string,
    private status: PolicyStatus,
    private readonly effectiveDate: Date,
    private readonly publishedAt: Date,
  ) {}

  /** Mint the next published version of a type. */
  public static publish(params: {
    type: PolicyType;
    version: number;
    title: string;
    content: string;
    effectiveDate: Date;
    now: Date;
  }): PolicyDocument {
    const title = params.title.trim();
    if (!title) {
      throw new InvalidInputError("정책 제목이 필요해요.");
    }
    if (!params.content.trim()) {
      throw new InvalidInputError("정책 본문이 필요해요.");
    }
    if (params.version < 1) {
      throw new InvalidInputError("버전은 1 이상이어야 해요.");
    }
    return new PolicyDocument(
      null,
      params.type,
      params.version,
      title,
      params.content,
      PolicyStatus.PUBLISHED,
      params.effectiveDate,
      params.now,
    );
  }

  public static reconstitute(params: {
    id: string;
    type: PolicyType;
    version: number;
    title: string;
    content: string;
    status: PolicyStatus;
    effectiveDate: Date;
    publishedAt: Date;
  }): PolicyDocument {
    return new PolicyDocument(
      params.id,
      params.type,
      params.version,
      params.title,
      params.content,
      params.status,
      params.effectiveDate,
      params.publishedAt,
    );
  }

  public isPublished(): boolean {
    return this.status === PolicyStatus.PUBLISHED;
  }

  public get getId(): string | null {
    return this.id;
  }
  public get getType(): PolicyType {
    return this.type;
  }
  public get getVersion(): number {
    return this.version;
  }
  public get getTitle(): string {
    return this.title;
  }
  public get getContent(): string {
    return this.content;
  }
  public get getStatus(): PolicyStatus {
    return this.status;
  }
  public get getEffectiveDate(): Date {
    return this.effectiveDate;
  }
  public get getPublishedAt(): Date {
    return this.publishedAt;
  }
}
