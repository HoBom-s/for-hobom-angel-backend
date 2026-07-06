import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";

const payload = { subjectRef: "a" };

describe("CreateOutboxEntity", () => {
  it("builds with sensible defaults", () => {
    const e = CreateOutboxEntity.of(EventType.ADOPTION_APPROVED, payload);
    expect(e.status).toBe(OutboxStatus.PENDING);
    expect(e.retryCount).toBe(0);
    expect(e.version).toBe(1);
    expect(e.payload).toEqual(payload);
  });

  it("rejects an empty payload", () => {
    expect(() =>
      CreateOutboxEntity.of(EventType.ADOPTION_APPROVED, {}),
    ).toThrow();
  });

  it("rejects a negative retry count", () => {
    expect(() =>
      CreateOutboxEntity.of(
        EventType.ADOPTION_APPROVED,
        payload,
        OutboxStatus.PENDING,
        -1,
      ),
    ).toThrow();
  });

  it("rejects a version below 1", () => {
    expect(() =>
      CreateOutboxEntity.of(
        EventType.ADOPTION_APPROVED,
        payload,
        OutboxStatus.PENDING,
        0,
        0,
      ),
    ).toThrow();
  });
});
