import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";
import { OutboxSchema } from "src/hb-backend-api/outbox/domain/model/outbox.schema";
import { OutboxPersistenceAdapter } from "src/hb-backend-api/outbox/adapters/out/outbox-persistence.adapter";
import { OutboxRepositoryImpl } from "src/hb-backend-api/outbox/infra/repositories/outbox.repository.impl";

/**
 * Outbox write path. Exposes {@link DIToken.OutboxModule.OutboxPersistencePort}
 * for domain modules to record events transactionally.
 *
 * TODO: add gRPC read/patch controllers (find PENDING, mark SENT/FAILED)
 * once the Angel outbox proto is published to hobom-buf-proto and pulled via
 * `npm run proto:pull`; then wire the microservice in main.ts.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutboxEntity.name, schema: OutboxSchema },
    ]),
  ],
  providers: [
    {
      provide: DIToken.OutboxModule.OutboxPersistencePort,
      useClass: OutboxPersistenceAdapter,
    },
    {
      provide: DIToken.OutboxModule.OutboxRepository,
      useClass: OutboxRepositoryImpl,
    },
  ],
  exports: [DIToken.OutboxModule.OutboxPersistencePort],
})
export class OutboxModule {}
