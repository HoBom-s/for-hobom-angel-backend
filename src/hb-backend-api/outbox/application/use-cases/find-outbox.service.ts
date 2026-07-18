import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { FindOutboxUseCase } from "src/hb-backend-api/outbox/domain/ports/in/find-outbox.use-case";
import {
  OutboxQueryPort,
  OutboxView,
} from "src/hb-backend-api/outbox/domain/ports/out/outbox-query.port";

@Injectable()
export class FindOutboxService implements FindOutboxUseCase {
  constructor(
    @Inject(DIToken.OutboxModule.OutboxQueryPort)
    private readonly outboxQueryPort: OutboxQueryPort,
  ) {}

  public invoke(
    eventType: EventType,
    status: OutboxStatus,
  ): Promise<OutboxView[]> {
    return this.outboxQueryPort.findByEventTypeAndStatus(eventType, status);
  }
}
