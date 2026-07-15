import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";
import { OutboxRepository } from "src/hb-backend-api/outbox/domain/repositories/outbox.repository";

@Injectable()
export class OutboxPersistenceAdapter implements OutboxPersistencePort {
  constructor(
    @Inject(DIToken.OutboxModule.OutboxRepository)
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public save(entity: CreateOutboxEntity): Promise<void> {
    return this.outboxRepository.save(entity);
  }

  public markAsSent(eventId: string): Promise<boolean> {
    return this.outboxRepository.markAsSent(eventId);
  }

  public markAsFailed(eventId: string, errorMessage: string): Promise<boolean> {
    return this.outboxRepository.markAsFailed(eventId, errorMessage);
  }
}
