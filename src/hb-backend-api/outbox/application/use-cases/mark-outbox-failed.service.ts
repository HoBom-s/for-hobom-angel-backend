import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { MarkOutboxFailedUseCase } from "src/hb-backend-api/outbox/domain/ports/in/mark-outbox.use-case";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";

@Injectable()
export class MarkOutboxFailedService implements MarkOutboxFailedUseCase {
  constructor(
    @Inject(DIToken.OutboxModule.OutboxPersistencePort)
    private readonly outboxPersistencePort: OutboxPersistencePort,
  ) {}

  public invoke(eventId: string, errorMessage: string): Promise<boolean> {
    return this.outboxPersistencePort.markAsFailed(
      eventId,
      errorMessage || "unknown error",
    );
  }
}
