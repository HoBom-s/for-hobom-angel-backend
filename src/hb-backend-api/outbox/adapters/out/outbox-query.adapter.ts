import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import {
  OutboxQueryPort,
  OutboxView,
} from "src/hb-backend-api/outbox/domain/ports/out/outbox-query.port";
import { OutboxRepository } from "src/hb-backend-api/outbox/domain/repositories/outbox.repository";

@Injectable()
export class OutboxQueryAdapter implements OutboxQueryPort {
  constructor(
    @Inject(DIToken.OutboxModule.OutboxRepository)
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public findByEventTypeAndStatus(
    eventType: EventType,
    status: OutboxStatus,
  ): Promise<OutboxView[]> {
    return this.outboxRepository.findByEventTypeAndStatus(eventType, status);
  }
}
