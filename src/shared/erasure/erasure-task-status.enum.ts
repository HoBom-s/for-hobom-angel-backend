/** Per-category task status. A DONE task is skipped on resume; PENDING/FAILED re-run. */
export enum ErasureTaskStatus {
  PENDING = "PENDING",
  DONE = "DONE",
  FAILED = "FAILED",
}
