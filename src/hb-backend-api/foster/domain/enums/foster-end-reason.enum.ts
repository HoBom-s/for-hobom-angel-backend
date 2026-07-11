/**
 * Why an active foster ended. EXPIRED = the planned end date passed;
 * EARLY_TERMINATED = a person ended it before then. Both trigger the
 * FOSTER_TERMINATED notification.
 */
export enum FosterEndReason {
  EXPIRED = "EXPIRED",
  EARLY_TERMINATED = "EARLY_TERMINATED",
}
