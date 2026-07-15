/**
 * A volunteer's signup state for one event. A signup starts PENDING (holding a
 * capacity slot) and the shelter's staff decides it — APPROVED keeps the slot,
 * REJECTED frees it. WITHDRAWN is the volunteer pulling out (from PENDING or
 * APPROVED), which also frees the slot. PENDING and APPROVED are the "live"
 * states that occupy a slot.
 */
export enum VolunteerSignupStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}
