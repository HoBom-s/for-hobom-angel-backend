/**
 * Why an active foster ended. EXPIRED = the planned end date passed;
 * EARLY_TERMINATED = a person ended it before then (both return the animal to
 * AVAILABLE and trigger the FOSTER_TERMINATED notification).
 * CONVERTED_TO_ADOPTION = the fosterer adopted the animal — a successful
 * outcome, not a termination; the animal becomes ADOPTED.
 */
export enum FosterEndReason {
  EXPIRED = "EXPIRED",
  EARLY_TERMINATED = "EARLY_TERMINATED",
  CONVERTED_TO_ADOPTION = "CONVERTED_TO_ADOPTION",
}
