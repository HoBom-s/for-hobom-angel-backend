import { RpcException } from "@nestjs/microservices";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { OutboxView } from "src/hb-backend-api/outbox/domain/ports/out/outbox-query.port";
import {
  parseEventType,
  parseStatus,
  toQueryResult,
} from "src/hb-backend-api/outbox/adapters/in/grpc/outbox-grpc.mapper";

const baseView = (over: Partial<OutboxView> = {}): OutboxView => ({
  id: "row-1",
  eventId: "evt-1",
  eventType: EventType.ADOPTION_APPROVED,
  payload: {},
  status: OutboxStatus.PENDING,
  retryCount: 0,
  sentAt: null,
  failedAt: null,
  lastError: null,
  version: 1,
  createdAt: new Date("2026-07-15T00:00:00.000Z"),
  updatedAt: new Date("2026-07-15T00:00:00.000Z"),
  ...over,
});

describe("outbox-grpc.mapper", () => {
  describe("parseEventType / parseStatus", () => {
    it("accepts valid enum strings", () => {
      expect(parseEventType("ADOPTION_APPROVED")).toBe(
        EventType.ADOPTION_APPROVED,
      );
      expect(parseStatus("PENDING")).toBe(OutboxStatus.PENDING);
    });

    it("rejects unknown values with an RpcException", () => {
      expect(() => parseEventType("NOPE")).toThrow(RpcException);
      expect(() => parseEventType("")).toThrow(RpcException);
      expect(() => parseStatus("done")).toThrow(RpcException);
    });
  });

  describe("toQueryResult", () => {
    it("maps transport fields with empty strings for null timestamps", () => {
      const result = toQueryResult(baseView({ lastError: null }));
      expect(result).toMatchObject({
        id: "row-1",
        eventId: "evt-1",
        eventType: "ADOPTION_APPROVED",
        status: "PENDING",
        retryCount: 0,
        sentAt: "",
        failedAt: "",
        lastError: "",
        version: 1,
        createdAt: "2026-07-15T00:00:00.000Z",
      });
    });

    it("discriminates an approval event into approval_approved", () => {
      const result = toQueryResult(
        baseView({
          eventType: EventType.STAFF_PROMOTION_APPROVED,
          payload: {
            subjectRef: "cand-1",
            recipientUserId: "user-1",
            shelterId: "shelter-1",
            occurredAt: "2026-07-15T00:00:01.000Z",
          },
        }),
      );
      const payload = result.payload as Record<string, any>;
      expect(payload.approval_approved).toMatchObject({
        approval_type: "APPROVAL_TYPE_STAFF_PROMOTION",
        subject_ref: "cand-1",
        recipient_user_id: "user-1",
        shelter_id: "shelter-1",
      });
      expect(payload.approval_approved.occurred_at.seconds).toBe(
        Math.floor(new Date("2026-07-15T00:00:01.000Z").getTime() / 1000),
      );
    });

    it("discriminates a foster termination with its reason enum", () => {
      const result = toQueryResult(
        baseView({
          eventType: EventType.FOSTER_TERMINATED,
          payload: {
            fosterProcessId: "fp-1",
            animalId: "a-1",
            recipientUserId: "user-2",
            reason: "EARLY_TERMINATED",
            occurredAt: "2026-07-15T00:00:02.000Z",
          },
        }),
      );
      const payload = result.payload as Record<string, any>;
      expect(payload.foster_terminated).toMatchObject({
        foster_process_id: "fp-1",
        animal_id: "a-1",
        recipient_user_id: "user-2",
        reason: "FOSTER_END_REASON_EARLY_TERMINATED",
      });
    });

    it("discriminates a HOBOM_LOG into access_log and stringifies meta", () => {
      const result = toQueryResult(
        baseView({
          eventType: EventType.HOBOM_LOG,
          payload: {
            traceId: "trace-1",
            level: "ERROR",
            method: "GET",
            path: "/x",
            statusCode: 500,
            host: "api",
            userId: "user-3",
            message: "boom",
            meta: { a: "1", b: { nested: true } },
          },
        }),
      );
      const payload = result.payload as Record<string, any>;
      expect(payload.access_log).toMatchObject({
        trace_id: "trace-1",
        level: "ERROR",
        status_code: 500,
        user_id: "user-3",
      });
      expect(payload.access_log.meta).toEqual({
        a: "1",
        b: JSON.stringify({ nested: true }),
      });
    });
  });
});
