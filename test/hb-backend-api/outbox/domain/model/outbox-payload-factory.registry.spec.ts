import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxPayloadFactoryRegistry } from "src/hb-backend-api/outbox/domain/model/outbox-payload-factory.registry";

describe("OutboxPayloadFactoryRegistry", () => {
  it("builds an approval payload", () => {
    const p = OutboxPayloadFactoryRegistry[EventType.ADOPTION_APPROVED]({
      subjectRef: "adoption-1",
      recipientUserId: "user-1",
      occurredAt: "2026-07-06T00:00:00Z",
    });
    expect(p).toMatchObject({
      subjectRef: "adoption-1",
      recipientUserId: "user-1",
    });
  });

  it("builds a foster-termination payload", () => {
    const p = OutboxPayloadFactoryRegistry[EventType.FOSTER_TERMINATED]({
      fosterProcessId: "f-1",
      animalId: "a-1",
      recipientUserId: "u-1",
      reason: "EXPIRED",
      occurredAt: "2026-07-06T00:00:00Z",
    });
    expect(p).toMatchObject({ reason: "EXPIRED", animalId: "a-1" });
  });

  it("has a factory for every event type", () => {
    for (const type of Object.values(EventType)) {
      expect(typeof OutboxPayloadFactoryRegistry[type]).toBe("function");
    }
  });
});
