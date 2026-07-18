/**
 * Lifecycle of one erasure request.
 *  QUARANTINED → cancelable grace window (PR2); 0-grace requests skip straight to
 *  PENDING → claimed for execution → IN_PROGRESS → COMPLETED | FAILED, or
 *  CANCELLED while still quarantined.
 */
export enum ErasureRequestStatus {
  QUARANTINED = "QUARANTINED",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}
