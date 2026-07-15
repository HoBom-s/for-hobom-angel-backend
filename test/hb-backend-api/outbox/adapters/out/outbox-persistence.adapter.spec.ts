import { Test } from "@nestjs/testing";
import { DIToken } from "src/shared/di/token.di";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxPersistenceAdapter } from "src/hb-backend-api/outbox/adapters/out/outbox-persistence.adapter";

describe("OutboxPersistenceAdapter", () => {
  const build = async (repo: Record<string, jest.Mock>) => {
    const module = await Test.createTestingModule({
      providers: [
        OutboxPersistenceAdapter,
        { provide: DIToken.OutboxModule.OutboxRepository, useValue: repo },
      ],
    }).compile();
    return module.get(OutboxPersistenceAdapter);
  };

  it("delegates save to the repository", async () => {
    const repo = { save: jest.fn() };
    const adapter = await build(repo);
    const entity = CreateOutboxEntity.of(EventType.ADOPTION_APPROVED, {
      subjectRef: "a",
    });
    await adapter.save(entity);
    expect(repo.save).toHaveBeenCalledWith(entity);
  });

  it("delegates markAsSent and markAsFailed to the repository", async () => {
    const repo = {
      markAsSent: jest.fn().mockResolvedValue(true),
      markAsFailed: jest.fn().mockResolvedValue(true),
    };
    const adapter = await build(repo);
    await adapter.markAsSent("e1");
    await adapter.markAsFailed("e1", "boom");
    expect(repo.markAsSent).toHaveBeenCalledWith("e1");
    expect(repo.markAsFailed).toHaveBeenCalledWith("e1", "boom");
  });
});
