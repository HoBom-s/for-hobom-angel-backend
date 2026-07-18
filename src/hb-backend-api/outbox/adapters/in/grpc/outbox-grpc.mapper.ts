import { status as GrpcStatus } from "@grpc/grpc-js";
import { RpcException } from "@nestjs/microservices";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { OutboxView } from "src/hb-backend-api/outbox/domain/ports/out/outbox-query.port";

/**
 * Maps outbox rows to the `outbox.angel` proto wire shape and parses inbound
 * enum strings. Field names are emitted verbatim (proto-loader `keepCase`), and
 * enums as their proto value names (`enums: String`). The opaque stored payload
 * is discriminated into the typed `AngelEventPayload` union by event type.
 */

const APPROVAL_EVENT_TYPES = new Set<EventType>([
  EventType.ADOPTION_APPROVED,
  EventType.FOSTER_APPROVED,
  EventType.STAFF_PROMOTION_APPROVED,
  EventType.SHELTER_VERIFICATION_APPROVED,
]);

const APPROVAL_TYPE_BY_EVENT: Record<string, string> = {
  [EventType.ADOPTION_APPROVED]: "APPROVAL_TYPE_ADOPTION",
  [EventType.FOSTER_APPROVED]: "APPROVAL_TYPE_FOSTER",
  [EventType.STAFF_PROMOTION_APPROVED]: "APPROVAL_TYPE_STAFF_PROMOTION",
  [EventType.SHELTER_VERIFICATION_APPROVED]:
    "APPROVAL_TYPE_SHELTER_VERIFICATION",
};

const FOSTER_END_REASON: Record<string, string> = {
  EXPIRED: "FOSTER_END_REASON_EXPIRED",
  EARLY_TERMINATED: "FOSTER_END_REASON_EARLY_TERMINATED",
};

export function parseEventType(raw: string): EventType {
  if (raw && (Object.values(EventType) as string[]).includes(raw)) {
    return raw as EventType;
  }
  throw new RpcException({
    code: GrpcStatus.INVALID_ARGUMENT,
    message: `Unknown eventType: ${raw}`,
  });
}

export function parseStatus(raw: string): OutboxStatus {
  if (raw && (Object.values(OutboxStatus) as string[]).includes(raw)) {
    return raw as OutboxStatus;
  }
  throw new RpcException({
    code: GrpcStatus.INVALID_ARGUMENT,
    message: `Unknown status: ${raw}`,
  });
}

/** ISO-8601, or "" when the date is null (per the proto's string timestamps). */
function isoOrEmpty(date: Date | null): string {
  return date ? date.toISOString() : "";
}

/** ISO string -> google.protobuf.Timestamp ({ seconds, nanos }); null -> undefined. */
function toTimestamp(
  iso: unknown,
): { seconds: number; nanos: number } | undefined {
  if (typeof iso !== "string" || iso === "") {
    return undefined;
  }
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) {
    return undefined;
  }
  return { seconds: Math.floor(ms / 1000), nanos: (ms % 1000) * 1_000_000 };
}

function str(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function toAngelEventPayload(view: OutboxView): Record<string, unknown> {
  const p = view.payload;

  if (APPROVAL_EVENT_TYPES.has(view.eventType)) {
    return {
      approval_approved: {
        approval_type:
          APPROVAL_TYPE_BY_EVENT[view.eventType] ?? "APPROVAL_TYPE_UNSPECIFIED",
        subject_ref: str(p, "subjectRef"),
        recipient_user_id: str(p, "recipientUserId"),
        shelter_id: str(p, "shelterId"),
        occurred_at: toTimestamp(p.occurredAt),
      },
    };
  }

  if (view.eventType === EventType.FOSTER_TERMINATED) {
    return {
      foster_terminated: {
        foster_process_id: str(p, "fosterProcessId"),
        animal_id: str(p, "animalId"),
        recipient_user_id: str(p, "recipientUserId"),
        reason:
          FOSTER_END_REASON[str(p, "reason")] ??
          "FOSTER_END_REASON_UNSPECIFIED",
        occurred_at: toTimestamp(p.occurredAt),
      },
    };
  }

  // HOBOM_LOG
  const meta: Record<string, string> = {};
  const rawMeta = p.meta;
  if (rawMeta && typeof rawMeta === "object") {
    for (const [k, v] of Object.entries(rawMeta as Record<string, unknown>)) {
      meta[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
  }
  return {
    access_log: {
      trace_id: str(p, "traceId"),
      level: str(p, "level"),
      method: str(p, "method"),
      path: str(p, "path"),
      status_code: typeof p.statusCode === "number" ? p.statusCode : 0,
      host: str(p, "host"),
      user_id: str(p, "userId"),
      message: str(p, "message"),
      meta,
    },
  };
}

export function toQueryResult(view: OutboxView): Record<string, unknown> {
  return {
    id: view.id,
    eventId: view.eventId,
    eventType: view.eventType,
    payload: toAngelEventPayload(view),
    status: view.status,
    retryCount: view.retryCount,
    sentAt: isoOrEmpty(view.sentAt),
    failedAt: isoOrEmpty(view.failedAt),
    lastError: view.lastError ?? "",
    version: view.version,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
  };
}
