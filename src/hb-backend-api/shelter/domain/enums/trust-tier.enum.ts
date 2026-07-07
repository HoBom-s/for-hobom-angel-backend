/**
 * How strongly the shelter's legitimacy was established, which scales its
 * privileges (esp. access to applicants' PII).
 *  - A: organizational proof verified (business/registration no. or designation).
 *  - B: limited — weaker proof (e.g. individual rescuer); privileges are reduced.
 */
export enum TrustTier {
  A = "A",
  B = "B",
}
