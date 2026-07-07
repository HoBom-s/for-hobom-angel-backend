/**
 * Outcome of an automated verification check. UNKNOWN means the check could not
 * be conclusively run (e.g. the external provider isn't wired yet) — the
 * operator then relies on manual review.
 */
export enum SignalStatus {
  PASS = "PASS",
  FAIL = "FAIL",
  UNKNOWN = "UNKNOWN",
}
