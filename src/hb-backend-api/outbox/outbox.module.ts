import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";
import { OutboxSchema } from "src/hb-backend-api/outbox/domain/model/outbox.schema";
import { OutboxPersistenceAdapter } from "src/hb-backend-api/outbox/adapters/out/outbox-persistence.adapter";
import { OutboxQueryAdapter } from "src/hb-backend-api/outbox/adapters/out/outbox-query.adapter";
import { OutboxRepositoryImpl } from "src/hb-backend-api/outbox/infra/repositories/outbox.repository.impl";
import { FindOutboxService } from "src/hb-backend-api/outbox/application/use-cases/find-outbox.service";
import { MarkOutboxSentService } from "src/hb-backend-api/outbox/application/use-cases/mark-outbox-sent.service";
import { MarkOutboxFailedService } from "src/hb-backend-api/outbox/application/use-cases/mark-outbox-failed.service";
import { FindOutboxGrpcController } from "src/hb-backend-api/outbox/adapters/in/grpc/find-outbox.grpc.controller";
import { PatchOutboxGrpcController } from "src/hb-backend-api/outbox/adapters/in/grpc/patch-outbox.grpc.controller";
import { GrpcApiKeyGuard } from "src/infra/grpc/grpc-api-key.guard";

/**
 * Outbox module. The write path exposes
 * {@link DIToken.OutboxModule.OutboxPersistencePort} for domain modules to record
 * events transactionally; the read/patch path is the gRPC relay API consumed by
 * hobom-event-processor (find PENDING/FAILED rows, mark SENT/FAILED). The gRPC
 * transport is bound in main.ts only once the Angel outbox proto is present.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutboxEntity.name, schema: OutboxSchema },
    ]),
  ],
  controllers: [FindOutboxGrpcController, PatchOutboxGrpcController],
  providers: [
    GrpcApiKeyGuard,
    {
      provide: DIToken.OutboxModule.OutboxPersistencePort,
      useClass: OutboxPersistenceAdapter,
    },
    {
      provide: DIToken.OutboxModule.OutboxQueryPort,
      useClass: OutboxQueryAdapter,
    },
    {
      provide: DIToken.OutboxModule.OutboxRepository,
      useClass: OutboxRepositoryImpl,
    },
    {
      provide: DIToken.OutboxModule.FindOutboxUseCase,
      useClass: FindOutboxService,
    },
    {
      provide: DIToken.OutboxModule.MarkOutboxSentUseCase,
      useClass: MarkOutboxSentService,
    },
    {
      provide: DIToken.OutboxModule.MarkOutboxFailedUseCase,
      useClass: MarkOutboxFailedService,
    },
  ],
  exports: [DIToken.OutboxModule.OutboxPersistencePort],
})
export class OutboxModule {}
