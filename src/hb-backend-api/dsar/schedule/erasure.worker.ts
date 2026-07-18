import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DIToken } from "src/shared/di/token.di";
import { HOBOM_TIME_ZONE } from "src/shared/constants/time-zone.constant";
import { ErasureEngine, SYSTEM_ACTOR } from "src/shared/erasure/erasure-engine";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/** Accounts fetched per scan query. */
const PAGE_SIZE = 200;
/** Safety ceiling per daily run — bounds the work even with a huge backlog. */
const MAX_PER_RUN = 5_000;
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
 * Per-subject erasure is idempotent, so this is safe to run on every instance;
 * a distributed lock for exactly-once is a later refinement (mirrors
 * {@link VolunteerExpirySchedule}). One subject's failure never aborts the batch.
 */
@Injectable()
export class ErasureWorker {
  private readonly logger = new Logger(ErasureWorker.name);

  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    private readonly engine: ErasureEngine,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: HOBOM_TIME_ZONE })
  public async handle(): Promise<void> {
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

      for (const subjectId of fresh) {
        seen.add(subjectId);
        try {
          await this.engine.erase({
            actorId: SYSTEM_ACTOR,
            subjectId,
            reason: PURGE_REASON,
          });
          purged += 1;
        } catch (error) {
          this.logger.error(
            `daily purge failed for ${subjectId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
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
}
