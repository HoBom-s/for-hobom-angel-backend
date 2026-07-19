import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { Model } from "mongoose";
import { LockEntity } from "src/shared/lock/lock.entity";

function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number } | null)?.code === 11000;
}

/**
 * A Mongo-backed distributed lock so a scheduled job runs on ONE instance, not
 * every replica. Uses the existing database — no new infra. When Redis lands,
 * swap this for a Redis lock behind the same {@link runExclusive} shape.
 *
 * Correctness rests on two things: `_id` is the lock name (a unique key, so a
 * second holder collides), and Mongo serializes writes to a single document (so
 * a race to take over an expired lock has exactly one winner — the loser's
 * filter no longer matches and its upsert collides).
 */
@Injectable()
export class DistributedLock {
  private readonly logger = new Logger(DistributedLock.name);
  private readonly owner = randomUUID();

  constructor(
    @InjectModel(LockEntity.name)
    private readonly model: Model<LockEntity>,
  ) {}

  /**
   * Runs `fn` iff this instance acquires `key`; returns null when another holds
   * it. The lock auto-expires after `ttlMs` (a crashed holder never blocks
   * forever) and is released once `fn` settles.
   */
  public async runExclusive<T>(
    key: string,
    ttlMs: number,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    if (!(await this.acquire(key, ttlMs))) {
      this.logger.debug(`lock '${key}' held elsewhere — skipping this run`);
      return null;
    }
    try {
      return await fn();
    } finally {
      await this.release(key);
    }
  }

  private async acquire(key: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    try {
      await this.model.updateOne(
        { _id: key, expiresAt: { $lt: now } },
        { $set: { owner: this.owner, expiresAt } },
        { upsert: true },
      );
      return true;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return false; // a live holder exists
      }
      throw error;
    }
  }

  private async release(key: string): Promise<void> {
    // Only delete if we still own it (an expired-and-retaken lock isn't ours).
    await this.model.deleteOne({ _id: key, owner: this.owner });
  }
}
