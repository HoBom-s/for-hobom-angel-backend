import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";

/**
 * Approval request aggregate — one row per decision (shelter verification, staff
 * promotion, adoption, foster). The state machine and its invariants live here;
 * on a terminal decision the use-case runs a type-specific callback that
 * transitions the target aggregate in the same transaction.
 *
 * `subjectRef` is the target domain entity id (e.g. a shelterId). Immutable
 * extra parties/scope a callback needs at submit time (e.g. a staff promotion's
 * shelterId) ride in `context`; decision-time details (e.g. the granted trust
 * tier) ride in `decisionMetadata`. Both keep the engine domain-agnostic.
 */
export class ApprovalRequest {
  private constructor(
    private readonly id: ApprovalId,
    private readonly type: ApprovalType,
    private readonly subjectRef: string,
    private readonly requesterId: string,
    private readonly context: Record<string, unknown> | null,
    private status: ApprovalStatus,
    private decidedBy: string | null,
    private decidedAt: Date | null,
    private reason: string | null,
    private decisionMetadata: Record<string, unknown> | null,
    private readonly version: number,
    private readonly createdAt: Date | null,
  ) {}

  public static submit(params: {
    type: ApprovalType;
    subjectRef: string;
    requesterId: string;
    context?: Record<string, unknown> | null;
  }): ApprovalRequest {
    if (!params.subjectRef?.trim() || !params.requesterId?.trim()) {
      throw new Error("승인 대상과 신청자가 필요해요.");
    }
    return new ApprovalRequest(
      ApprovalId.generate(),
      params.type,
      params.subjectRef,
      params.requesterId,
      params.context ?? null,
      ApprovalStatus.PENDING,
      null,
      null,
      null,
      null,
      0,
      null,
    );
  }

  public static reconstitute(params: {
    id: ApprovalId;
    type: ApprovalType;
    subjectRef: string;
    requesterId: string;
    context?: Record<string, unknown> | null;
    status: ApprovalStatus;
    decidedBy: string | null;
    decidedAt: Date | null;
    reason: string | null;
    decisionMetadata: Record<string, unknown> | null;
    version: number;
    createdAt?: Date | null;
  }): ApprovalRequest {
    return new ApprovalRequest(
      params.id,
      params.type,
      params.subjectRef,
      params.requesterId,
      params.context ?? null,
      params.status,
      params.decidedBy,
      params.decidedAt,
      params.reason,
      params.decisionMetadata,
      params.version,
      params.createdAt ?? null,
    );
  }

  public approve(
    actorId: string,
    at: Date,
    metadata?: Record<string, unknown>,
    reason?: string,
  ): void {
    this.assertPending("승인");
    this.status = ApprovalStatus.APPROVED;
    this.decidedBy = actorId;
    this.decidedAt = at;
    this.reason = reason?.trim() || null;
    this.decisionMetadata = metadata ?? null;
  }

  public reject(actorId: string, at: Date, reason: string): void {
    this.assertPending("반려");
    if (!reason?.trim()) {
      throw new Error("반려 사유가 필요해요.");
    }
    this.status = ApprovalStatus.REJECTED;
    this.decidedBy = actorId;
    this.decidedAt = at;
    this.reason = reason.trim();
  }

  public cancel(actorId: string, at: Date): void {
    this.assertPending("취소");
    this.status = ApprovalStatus.CANCELLED;
    this.decidedBy = actorId;
    this.decidedAt = at;
  }

  public isPending(): boolean {
    return this.status === ApprovalStatus.PENDING;
  }

  public isApproved(): boolean {
    return this.status === ApprovalStatus.APPROVED;
  }

  private assertPending(action: string): void {
    if (this.status !== ApprovalStatus.PENDING) {
      throw new Error(
        `이미 처리된 요청이에요(${this.status}). ${action}할 수 없어요.`,
      );
    }
  }

  public get getId(): ApprovalId {
    return this.id;
  }
  public get getType(): ApprovalType {
    return this.type;
  }
  public get getSubjectRef(): string {
    return this.subjectRef;
  }
  public get getRequesterId(): string {
    return this.requesterId;
  }
  /** Immutable submit-time context a callback needs (e.g. `{ shelterId }`). */
  public get getContext(): Record<string, unknown> | null {
    return this.context;
  }
  public get getStatus(): ApprovalStatus {
    return this.status;
  }
  public get getDecidedBy(): string | null {
    return this.decidedBy;
  }
  public get getDecidedAt(): Date | null {
    return this.decidedAt;
  }
  public get getReason(): string | null {
    return this.reason;
  }
  public get getDecisionMetadata(): Record<string, unknown> | null {
    return this.decisionMetadata;
  }
  public get getVersion(): number {
    return this.version;
  }
  /** Submission time; null on an in-memory instance not yet persisted. */
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
}
