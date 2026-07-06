import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";

/**
 * A single audit record to append. Built via the validating factory so an
 * incomplete audit entry (no actor / no subject) can never be recorded — the
 * whole point of the trail is that "who touched whose data, and why" is provable.
 */
export class AuditEvent {
  private constructor(
    public readonly action: AuditAction,
    public readonly actorId: string,
    public readonly subjectUserId: string,
    public readonly field: string | null,
    public readonly reason: string | null,
    public readonly traceId: string | null,
  ) {}

  public static of(params: {
    action: AuditAction;
    actorId: string;
    subjectUserId: string;
    field?: string | null;
    reason?: string | null;
    traceId?: string | null;
  }): AuditEvent {
    if (!params.actorId?.trim()) {
      throw new Error("감사 로그에 actorId가 필요해요.");
    }
    if (!params.subjectUserId?.trim()) {
      throw new Error("감사 로그에 subjectUserId가 필요해요.");
    }
    return new AuditEvent(
      params.action,
      params.actorId,
      params.subjectUserId,
      params.field ?? null,
      params.reason ?? null,
      params.traceId ?? null,
    );
  }
}
