import { SchemaFactory } from "@nestjs/mongoose";
import { LockEntity } from "src/shared/lock/lock.entity";

export const LockSchema = SchemaFactory.createForClass(LockEntity);

// Belt-and-suspenders cleanup of dead locks (acquire also treats expired as free).
LockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
