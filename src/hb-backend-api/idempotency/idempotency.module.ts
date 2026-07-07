import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { IdempotencyKeyEntity } from "src/hb-backend-api/idempotency/domain/model/idempotency-key.entity";
import { IdempotencyKeySchema } from "src/hb-backend-api/idempotency/domain/model/idempotency-key.schema";
import { IdempotencyAdapter } from "src/hb-backend-api/idempotency/adapters/out/idempotency.adapter";
import { IdempotencyRepositoryImpl } from "src/hb-backend-api/idempotency/infra/repositories/idempotency.repository.impl";

/**
 * At-most-once request guard. Exposes {@link DIToken.IdempotencyModule.IdempotencyPort}
 * for use-cases (approval transitions, client-retried writes) to reserve a key
 * inside their transaction.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IdempotencyKeyEntity.name, schema: IdempotencyKeySchema },
    ]),
  ],
  providers: [
    {
      provide: DIToken.IdempotencyModule.IdempotencyPort,
      useClass: IdempotencyAdapter,
    },
    {
      provide: DIToken.IdempotencyModule.IdempotencyRepository,
      useClass: IdempotencyRepositoryImpl,
    },
  ],
  exports: [DIToken.IdempotencyModule.IdempotencyPort],
})
export class IdempotencyModule {}
