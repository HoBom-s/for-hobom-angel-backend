/**
 * Foster application lifecycle. PENDING while the shelter reviews; the decision
 * callback moves it to APPROVED/REJECTED. WITHDRAWN if the applicant pulls out.
 * Once APPROVED the foster is active until it ends (see the application's
 * `endedAt`/`endReason`).
 */
export enum FosterApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}
