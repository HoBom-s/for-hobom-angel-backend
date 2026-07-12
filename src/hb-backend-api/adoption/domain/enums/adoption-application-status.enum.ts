/**
 * Adoption application lifecycle. PENDING while the shelter reviews (mirrored by
 * the approval request); the decision callback moves it to APPROVED/REJECTED.
 * WITHDRAWN if the applicant pulls out before a decision. RETURNED if the animal
 * comes back after an approved adoption (파양/반환).
 */
export enum AdoptionApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
  RETURNED = "RETURNED",
}
