/**
 * Shelter lifecycle. A shelter can only operate (list animals, run adoptions,
 * approve staff) once VERIFIED — that gate is the root of the trust chain.
 */
export enum ShelterStatus {
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}
