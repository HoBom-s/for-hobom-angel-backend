import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DIToken } from "src/shared/di/token.di";
import { HOBOM_TIME_ZONE } from "src/shared/constants/time-zone.constant";
import { DistributedLock } from "src/shared/lock/distributed-lock";
import { RetentionPolicy } from "src/shared/erasure/retention-policy";
import { AuditRepository } from "src/hb-backend-api/audit/domain/repositories/audit.repository";

const LOCK_KEY = "audit.retention-sweep";
const LOCK_TTL_MS = 10 * 60_000;

/**
 * Legal-retention sweep for the audit trail. The trail is RETAINED (it proves
 * who touched whose PII, and that erasures happened), but retention is not
 * unbounded — logs are purged once past the statutory window
 * ({@link RetentionPolicy.auditLogYears}). A logged @Cron (not a silent TTL
 * index) keeps the destruction of compliance records itself observable.
 */
@Injectable()
export class AuditRetentionSchedule {
  private readonly logger = new Logger(AuditRetentionSchedule.name);

  constructor(
    @Inject(DIToken.AuditModule.AuditRepository)
    private readonly auditRepository: AuditRepository,
    private readonly lock: DistributedLock,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM, { timeZone: HOBOM_TIME_ZONE })
  public async handle(): Promise<void> {
    await this.lock.runExclusive(LOCK_KEY, LOCK_TTL_MS, () => this.sweep());
  }

  private async sweep(): Promise<void> {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - RetentionPolicy.auditLogYears);

    const purged = await this.auditRepository.purgeOlderThan(cutoff);
    if (purged > 0) {
      this.logger.log(
        `audit retention: purged ${purged} log(s) older than ${RetentionPolicy.auditLogYears}y`,
      );
    }
  }
}
