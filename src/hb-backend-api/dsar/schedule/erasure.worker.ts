import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DIToken } from "src/shared/di/token.di";
import { HOBOM_TIME_ZONE } from "src/shared/constants/time-zone.constant";
import { DistributedLock } from "src/shared/lock/distributed-lock";
import { ErasureEngine, SYSTEM_ACTOR } from "src/shared/erasure/erasure-engine";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

const LOCK_KEY = "erasure.daily-sweep";
/** Lock lifetime — generous enough for a full drain; frees a crashed holder. */
const LOCK_TTL_MS = 30 * 60_000;
/** Accounts fetched per scan query. */
const PAGE_SIZE = 200;
/** Safety ceiling per daily run — bounds the work even with a huge backlog. */
const MAX_PER_RUN = 5_000;
/**
 * How many subjects to erase at once. Different subjects touch disjoint
 * documents (own row, own tokens, own request/audit inserts), so there is no
 * write conflict between them — bounded concurrency just cuts wall-clock. Kept
 * well under the Mongoose pool size to avoid starving it.
 */
const CONCURRENCY = 8;
const PURGE_REASON = "scheduled purge after withdrawal grace";

/**
 * The daily erasure sweep — this is where destruction actually happens (the
 * controller only reads). At 03:00 KST it drains withdrawn accounts whose grace
 * has elapsed, erasing each subject through the engine.
 *
 * Drains the whole backlog (not a single page): a purged account clears its
 * `purgeAfter`, so it drops out of the next scan — re-querying yields the next
 * batch with no offset (a self-draining cursor). The loop stops when the backlog
 * is empty, when only already-attempted (poison) accounts remain — tracked in
 * `seen` so a failing account can't spin the loop — or at the {@link MAX_PER_RUN}
 * ceiling, which is logged (never a silent cap; the remainder is taken next run).
 *
 * A distributed lock keeps it to one instance per run; per-subject erasure is
 * idempotent regardless, so a lock miss is harmless. One subject's failure never
 * aborts the batch.
 */
@Injectable()
export class ErasureWorker {
  private readonly logger = new Logger(ErasureWorker.name);

  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    private readonly engine: ErasureEngine,
    private readonly lock: DistributedLock,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: HOBOM_TIME_ZONE })
  public async handle(): Promise<void> {
    await this.lock.runExclusive(LOCK_KEY, LOCK_TTL_MS, () => this.sweep());
  }

  private async sweep(): Promise<void> {
    const seen = new Set<string>();
    let purged = 0;

    while (seen.size < MAX_PER_RUN) {
      const page = await this.userQueryPort.findWithdrawnToPurge(
        new Date(),
        PAGE_SIZE,
      );
      const fresh = page.filter((id) => !seen.has(id));
      if (fresh.length === 0) {
        break; // drained, or only poison accounts remain
      }
      fresh.forEach((id) => seen.add(id));

      // Erase the page in bounded-concurrency chunks.
      for (let i = 0; i < fresh.length; i += CONCURRENCY) {
        const chunk = fresh.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map((id) => this.eraseOne(id)));
        purged += results.filter(Boolean).length;
      }

      if (page.length < PAGE_SIZE) {
        break; // last (partial) page
      }
    }

    if (seen.size === 0) {
      return;
    }
    this.logger.log(
      `daily erasure sweep: purged ${purged}/${seen.size} withdrawn account(s)`,
    );
    if (seen.size >= MAX_PER_RUN) {
      this.logger.warn(
        `erasure ceiling ${MAX_PER_RUN} reached — backlog remains, resuming next run`,
      );
    }
  }

  private async eraseOne(subjectId: string): Promise<boolean> {
    try {
      await this.engine.erase({
        actorId: SYSTEM_ACTOR,
        subjectId,
        reason: PURGE_REASON,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `daily purge failed for ${subjectId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
