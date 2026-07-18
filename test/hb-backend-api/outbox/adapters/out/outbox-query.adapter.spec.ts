import { Test } from "@nestjs/testing";
import { DIToken } from "src/shared/di/token.di";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { OutboxQueryAdapter } from "src/hb-backend-api/outbox/adapters/out/outbox-query.adapter";

describe("OutboxQueryAdapter", () => {
  it("delegates findByEventTypeAndStatus to the repository", async () => {
    const rows = [{ eventId: "e1" }];
    const repo = {
      findByEventTypeAndStatus: jest.fn().mockResolvedValue(rows),
    };
    const module = await Test.createTestingModule({
      providers: [
        OutboxQueryAdapter,
        { provide: DIToken.OutboxModule.OutboxRepository, useValue: repo },
      ],
    }).compile();

    const adapter = module.get(OutboxQueryAdapter);
    const result = await adapter.findByEventTypeAndStatus(
      EventType.HOBOM_LOG,
      OutboxStatus.PENDING,
    );

    expect(repo.findByEventTypeAndStatus).toHaveBeenCalledWith(
      EventType.HOBOM_LOG,
      OutboxStatus.PENDING,
    );
    expect(result).toBe(rows);
  });
});
