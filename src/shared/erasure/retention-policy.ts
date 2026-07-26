/**
 * Central retention schedule (confirmed 2026-07-18). Every window lives here so
 * legal can tune the numbers without touching disposition logic.
 *
 * PIPA Art.21: destroy "without undue delay" (within 5 days of the window ending).
 * The ⚠ values are proposed defaults pending legal confirmation.
 */
export const RetentionPolicy = {
  /** DSAR erase quarantine (cancelable). 0 = immediate; a window lands in PR2. */
  quarantineHours: 0,
  /** Self-withdrawal recovery grace before the auto-purge sweep runs. */
  withdrawalGraceDays: 30,
  /** Outbox rows purged after delivery / after the debug window. */
  outboxSentDays: 7,
  outboxFailedDays: 30,
  /** Idempotency keys (enforced by a native Mongo TTL index). */
  idempotencyHours: 24,
  /** Erasure request/receipt evidence retention. */
  erasureRequestDays: 90,
  /** ⚠ pending legal — adoption/foster records legal-hold window. */
  applicationLegalYears: 5,
  /** ⚠ pending legal — access-record retention duty. */
  auditLogYears: 3,
  /** ⚠ pending legal — adopter-safety signal re-evaluation window. */
  adopterHistoryYears: 3,
} as const;
