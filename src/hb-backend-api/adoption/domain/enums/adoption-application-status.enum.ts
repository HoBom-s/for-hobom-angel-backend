/**
 * Adoption application lifecycle. PENDING while the shelter reviews (mirrored by
 * the approval request); the decision callback moves it to APPROVED/REJECTED.
 * WITHDRAWN if the applicant pulls out before a decision.
 */
export enum AdoptionApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}
