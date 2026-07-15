import { Controller, Inject, UseGuards } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DIToken } from "src/shared/di/token.di";
import { GrpcApiKeyGuard } from "src/infra/grpc/grpc-api-key.guard";
import { FindOutboxUseCase } from "src/hb-backend-api/outbox/domain/ports/in/find-outbox.use-case";
import {
  parseEventType,
  parseStatus,
  toQueryResult,
} from "src/hb-backend-api/outbox/adapters/in/grpc/outbox-grpc.mapper";

interface FindRequest {
  eventType: string;
  status: string;
}

/**
 * gRPC read side of the outbox (proto service `FindHoBomAngelOutboxController`).
 * hobom-event-processor polls this to fetch rows to publish to Kafka.
 */
@Controller()
@UseGuards(GrpcApiKeyGuard)
export class FindOutboxGrpcController {
  constructor(
    @Inject(DIToken.OutboxModule.FindOutboxUseCase)
    private readonly findOutboxUseCase: FindOutboxUseCase,
  ) {}

  @GrpcMethod(
    "FindHoBomAngelOutboxController",
    "FindOutboxByEventTypeAndStatusUseCase",
  )
  public async find(
    request: FindRequest,
  ): Promise<{ items: Record<string, unknown>[] }> {
    const rows = await this.findOutboxUseCase.invoke(
      parseEventType(request.eventType),
      parseStatus(request.status),
    );
    return { items: rows.map(toQueryResult) };
  }
}
