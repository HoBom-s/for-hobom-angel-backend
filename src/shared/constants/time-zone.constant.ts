/**
 * The platform's wall-clock timezone. Scheduled jobs (@Cron) run against this,
 * so "every hour"/"every day at 3am" mean KST, not the server's UTC. Instant
 * comparisons (e.g. endAt < now) are timezone-independent and don't need it.
 */
export const HOBOM_TIME_ZONE = "Asia/Seoul";
