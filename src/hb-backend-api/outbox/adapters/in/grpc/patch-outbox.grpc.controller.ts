import { Controller, Inject, UseGuards } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DIToken } from "src/shared/di/token.di";
import { GrpcApiKeyGuard } from "src/infra/grpc/grpc-api-key.guard";
import {
  MarkOutboxFailedUseCase,
  MarkOutboxSentUseCase,
} from "src/hb-backend-api/outbox/domain/ports/in/mark-outbox.use-case";

interface MarkRequest {
  eventId: string;
}

interface MarkFailedRequest {
  eventId: string;
  errorMessage: string;
}

/**
 * gRPC patch side of the outbox (proto service `PatchHoBomAngelOutboxController`).
 * hobom-event-processor calls these after each publish attempt to advance a row.
 * Both return google.protobuf.Empty (`{}`).
 */
@Controller()
@UseGuards(GrpcApiKeyGuard)
export class PatchOutboxGrpcController {
  constructor(
    @Inject(DIToken.OutboxModule.MarkOutboxSentUseCase)
    private readonly markOutboxSentUseCase: MarkOutboxSentUseCase,
    @Inject(DIToken.OutboxModule.MarkOutboxFailedUseCase)
    private readonly markOutboxFailedUseCase: MarkOutboxFailedUseCase,
  ) {}

  @GrpcMethod("PatchHoBomAngelOutboxController", "PatchOutboxMarkAsSentUseCase")
  public async markSent(request: MarkRequest): Promise<Record<string, never>> {
    await this.markOutboxSentUseCase.invoke(request.eventId);
    return {};
  }

  @GrpcMethod(
    "PatchHoBomAngelOutboxController",
    "PatchOutboxMarkAsFailedUseCase",
  )
  public async markFailed(
    request: MarkFailedRequest,
  ): Promise<Record<string, never>> {
    await this.markOutboxFailedUseCase.invoke(
      request.eventId,
      request.errorMessage,
    );
    return {};
  }
}
