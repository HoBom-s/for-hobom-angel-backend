import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AuditModule } from "src/hb-backend-api/audit/audit.module";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureEngine } from "src/shared/erasure/erasure-engine";
import { ErasureMetrics } from "src/shared/erasure/erasure-metrics";
import { ErasureRequestEntity } from "src/shared/erasure/erasure-request.entity";
import { ErasureRequestSchema } from "src/shared/erasure/erasure-request.schema";
import { ErasureRequestRepositoryImpl } from "src/shared/erasure/erasure-request.repository.impl";
import { Reconciler } from "src/shared/erasure/reconciler";

/**
 * Erasure framework core. Owns the {@link DestroyerRegistry} (domain modules
 * self-register their destroyers), the {@link ErasureEngine} lifecycle, the
 * {@link Reconciler}, and the request store. Depends only on AuditModule (the
 * engine records DELETE_PII) — never on the consumer domains, so the dependency
 * graph stays acyclic (consumers → ErasureModule).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ErasureRequestEntity.name, schema: ErasureRequestSchema },
    ]),
    AuditModule,
  ],
  providers: [
    DestroyerRegistry,
    Reconciler,
    ErasureMetrics,
    ErasureEngine,
    {
      provide: DIToken.ErasureModule.ErasureRequestRepository,
      useClass: ErasureRequestRepositoryImpl,
    },
  ],
  exports: [DestroyerRegistry, ErasureEngine],
})
export class ErasureModule {}
