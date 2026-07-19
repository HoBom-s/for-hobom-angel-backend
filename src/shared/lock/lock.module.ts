import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DistributedLock } from "src/shared/lock/distributed-lock";
import { LockEntity } from "src/shared/lock/lock.entity";
import { LockSchema } from "src/shared/lock/lock.schema";

/**
 * Global distributed-lock infra (Mongo-backed) so scheduled jobs run on a single
 * instance. Global — every module's @Cron can inject {@link DistributedLock}.
 */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: LockEntity.name, schema: LockSchema }]),
  ],
  providers: [DistributedLock],
  exports: [DistributedLock],
})
export class LockModule {}
