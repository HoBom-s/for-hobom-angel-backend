import { Test } from "@nestjs/testing";
import { DIToken } from "src/shared/di/token.di";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxPersistenceAdapter } from "src/hb-backend-api/outbox/adapters/out/outbox-persistence.adapter";

describe("OutboxPersistenceAdapter", () => {
  it("delegates save to the repository", async () => {
    const repo = { save: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        OutboxPersistenceAdapter,
        { provide: DIToken.OutboxModule.OutboxRepository, useValue: repo },
      ],
    }).compile();

    const adapter = module.get(OutboxPersistenceAdapter);
    const entity = CreateOutboxEntity.of(EventType.ADOPTION_APPROVED, {
      subjectRef: "a",
    });
    await adapter.save(entity);
    expect(repo.save).toHaveBeenCalledWith(entity);
  });
});
