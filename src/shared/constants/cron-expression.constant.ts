/** Shared cron expressions (Asia/Seoul). Used by @RegisterJob schedulers. */
export const CronExpression = {
  DAILY_3AM: "0 3 * * *",
  DAILY_6AM: "0 6 * * *",
  DAILY_9AM: "0 9 * * *",
  EVERY_10_MINUTES: "*/10 * * * *",
} as const;
