import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { ReportReason } from "src/hb-backend-api/report/domain/enums/report-reason.enum";
import { ReportResolution } from "src/hb-backend-api/report/domain/enums/report-resolution.enum";
import { ReportStatus } from "src/hb-backend-api/report/domain/enums/report-status.enum";
import { ReportTargetType } from "src/hb-backend-api/report/domain/enums/report-target-type.enum";
import { ReportId } from "src/hb-backend-api/report/domain/model/vo/report-id.vo";

/**
 * Report aggregate — a member's report of an animal, shelter, or user. It owns
 * the review state machine (PENDING → RESOLVED); a platform operator resolves it
 * with a verdict (DISMISSED/UPHELD) and a note. Enforcing the verdict (blinding
 * content, sanctioning a user) is a separate downstream step.
 */
export class Report {
  private static readonly MAX_DETAIL = 2000;

  private constructor(
    private readonly id: ReportId,
    private readonly reporterId: UserId,
    private readonly targetType: ReportTargetType,
    private readonly targetRef: string,
    private readonly reason: ReportReason,
    private readonly detail: string,
    private status: ReportStatus,
    private resolution: ReportResolution | null,
    private resolutionNote: string | null,
    private resolvedBy: UserId | null,
    private resolvedAt: Date | null,
    private readonly version: number,
  ) {}

  public static submit(params: {
    reporterId: UserId;
    targetType: ReportTargetType;
    targetRef: string;
    reason: ReportReason;
    detail?: string;
  }): Report {
    if (!params.targetRef?.trim()) {
      throw new Error("신고 대상이 필요해요.");
    }
    const detail = params.detail?.trim() ?? "";
    if (detail.length > Report.MAX_DETAIL) {
      throw new Error(`신고 내용은 최대 ${Report.MAX_DETAIL}자까지예요.`);
    }
    return new Report(
      ReportId.generate(),
      params.reporterId,
      params.targetType,
      params.targetRef.trim(),
      params.reason,
      detail,
      ReportStatus.PENDING,
      null,
      null,
      null,
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: ReportId;
    reporterId: UserId;
    targetType: ReportTargetType;
    targetRef: string;
    reason: ReportReason;
    detail: string;
    status: ReportStatus;
    resolution: ReportResolution | null;
    resolutionNote: string | null;
    resolvedBy: UserId | null;
    resolvedAt: Date | null;
    version: number;
  }): Report {
    return new Report(
      params.id,
      params.reporterId,
      params.targetType,
      params.targetRef,
      params.reason,
      params.detail,
      params.status,
      params.resolution,
      params.resolutionNote,
      params.resolvedBy,
      params.resolvedAt,
      params.version,
    );
  }

  /** An operator closes the report with a verdict. */
  public resolve(
    actorId: UserId,
    resolution: ReportResolution,
    note: string,
    at: Date,
  ): void {
    if (this.status !== ReportStatus.PENDING) {
      throw new Error("이미 처리된 신고예요.");
    }
    this.status = ReportStatus.RESOLVED;
    this.resolution = resolution;
    this.resolutionNote = note?.trim() || null;
    this.resolvedBy = actorId;
    this.resolvedAt = at;
  }

  public isPending(): boolean {
    return this.status === ReportStatus.PENDING;
  }

  public get getId(): ReportId {
    return this.id;
  }
  public get getReporterId(): UserId {
    return this.reporterId;
  }
  public get getTargetType(): ReportTargetType {
    return this.targetType;
  }
  public get getTargetRef(): string {
    return this.targetRef;
  }
  public get getReason(): ReportReason {
    return this.reason;
  }
  public get getDetail(): string {
    return this.detail;
  }
  public get getStatus(): ReportStatus {
    return this.status;
  }
  public get getResolution(): ReportResolution | null {
    return this.resolution;
  }
  public get getResolutionNote(): string | null {
    return this.resolutionNote;
  }
  public get getResolvedBy(): UserId | null {
    return this.resolvedBy;
  }
  public get getResolvedAt(): Date | null {
    return this.resolvedAt;
  }
  public get getVersion(): number {
    return this.version;
  }
}
