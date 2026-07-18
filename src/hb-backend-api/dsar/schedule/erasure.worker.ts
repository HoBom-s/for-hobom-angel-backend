import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DIToken } from "src/shared/di/token.di";
import { HOBOM_TIME_ZONE } from "src/shared/constants/time-zone.constant";
import { ErasureEngine, SYSTEM_ACTOR } from "src/shared/erasure/erasure-engine";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

const PURGE_BATCH_LIMIT = 200;
const PURGE_REASON = "scheduled purge after withdrawal grace";

/**
 * The daily erasure sweep — this is where destruction actually happens (the
 * controller only files/reads). At 03:00 KST it finds withdrawn accounts whose
 * grace has elapsed and runs a full erasure per subject through the engine.
 *
 * Per-subject erasure is idempotent (anonymized rows drop out of the scan), so
 * this is safe to run on every instance; a distributed lock for exactly-once is
 * a later refinement (mirrors {@link VolunteerExpirySchedule}). A single
 * subject's failure is logged and never aborts the rest of the batch.
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
    const subjectIds = await this.userQueryPort.findWithdrawnToPurge(
      new Date(),
      PURGE_BATCH_LIMIT,
    );
    if (subjectIds.length === 0) {
      return;
    }

    let purged = 0;
    for (const subjectId of subjectIds) {
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
    this.logger.log(
      `daily erasure sweep: purged ${purged}/${subjectIds.length} withdrawn account(s)`,
    );
  }
}
