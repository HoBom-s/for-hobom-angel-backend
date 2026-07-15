import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { FindOutboxService } from "src/hb-backend-api/outbox/application/use-cases/find-outbox.service";
import { MarkOutboxSentService } from "src/hb-backend-api/outbox/application/use-cases/mark-outbox-sent.service";
import { MarkOutboxFailedService } from "src/hb-backend-api/outbox/application/use-cases/mark-outbox-failed.service";

describe("outbox relay services", () => {
  it("FindOutboxService delegates to the query port", async () => {
    const rows = [{ eventId: "e1" }];
    const queryPort = {
      findByEventTypeAndStatus: jest.fn().mockResolvedValue(rows),
    };
    const service = new FindOutboxService(queryPort);

    await expect(
      service.invoke(EventType.ADOPTION_APPROVED, OutboxStatus.PENDING),
    ).resolves.toBe(rows);
    expect(queryPort.findByEventTypeAndStatus).toHaveBeenCalledWith(
      EventType.ADOPTION_APPROVED,
      OutboxStatus.PENDING,
    );
  });

  it("MarkOutboxSentService delegates to the persistence port", async () => {
    const port = { markAsSent: jest.fn().mockResolvedValue(true) };
    const service = new MarkOutboxSentService(port as never);
    await service.invoke("e1");
    expect(port.markAsSent).toHaveBeenCalledWith("e1");
  });

  it("MarkOutboxFailedService substitutes a default for an empty error", async () => {
    const port = { markAsFailed: jest.fn().mockResolvedValue(true) };
    const service = new MarkOutboxFailedService(port as never);
    await service.invoke("e1", "");
    expect(port.markAsFailed).toHaveBeenCalledWith("e1", "unknown error");
  });
});
