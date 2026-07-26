/**
 * How a data category is disposed of on erasure.
 *  - HARD_DELETE  — remove the row entirely.
 *  - ANONYMIZE    — sever the user link + strip free-text PII, keep the row for
 *                   referential integrity / analytics.
 *  - RETAIN       — kept under a legal basis; not erased on request (purged later
 *                   by a retention sweep). Reports zero residual to the reconciler.
 *  - PURGE_WINDOW — deleted after a TTL (mostly native Mongo TTL indexes).
 */
export enum Disposition {
  HARD_DELETE = "HARD_DELETE",
  ANONYMIZE = "ANONYMIZE",
  RETAIN = "RETAIN",
  PURGE_WINDOW = "PURGE_WINDOW",
}
