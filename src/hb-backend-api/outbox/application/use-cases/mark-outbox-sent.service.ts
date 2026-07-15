import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { MarkOutboxSentUseCase } from "src/hb-backend-api/outbox/domain/ports/in/mark-outbox.use-case";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";

@Injectable()
export class MarkOutboxSentService implements MarkOutboxSentUseCase {
  constructor(
    @Inject(DIToken.OutboxModule.OutboxPersistencePort)
    private readonly outboxPersistencePort: OutboxPersistencePort,
  ) {}

  public invoke(eventId: string): Promise<boolean> {
    return this.outboxPersistencePort.markAsSent(eventId);
  }
}
