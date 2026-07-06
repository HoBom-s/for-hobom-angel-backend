import { applyDecorators } from "@nestjs/common";
import { Cron, CronOptions } from "@nestjs/schedule";

interface RegisterJobOptions {
  cron: string;
  timeZone?: string;
}

/**
 * Class-level scheduler decorator. Binds `@nestjs/schedule`'s Cron to the
 * class's `process` method with a default Seoul timezone, so schedulers share
 * a uniform shape:
 *
 *   @RegisterJob({ cron: CronExpression.DAILY_3AM })
 *   export class ProcessExpiredOutboxCleanupScheduler {
 *     public async process(): Promise<void> { ... }
 *   }
 */
export function RegisterJob(options: RegisterJobOptions): ClassDecorator {
  const cronOptions: CronOptions = {
    timeZone: options.timeZone ?? "Asia/Seoul",
  };
  return (target) => {
    const descriptor = Object.getOwnPropertyDescriptor(
      target.prototype as object,
      "process",
    );
    if (!descriptor) {
      throw new Error(
        `@RegisterJob requires a 'process' method on ${target.name}`,
      );
    }
    applyDecorators(Cron(options.cron, cronOptions))(
      target.prototype as object,
      "process",
      descriptor,
    );
  };
}
