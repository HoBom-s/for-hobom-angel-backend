import { VerifiedIdentity } from "src/hb-backend-api/identity/domain/model/verified-identity";

/**
 * Outbound port to the 본인확인 (CI/DI identity verification) vendor. The client
 * completes verification with the vendor and receives a short-lived receipt
 * (`verificationToken`); the backend exchanges it here for the attested
 * {@link VerifiedIdentity}. The concrete vendor adapter is pending (provider
 * TBD) — see the stub implementation.
 */
export interface IdentityVerificationPort {
  /**
   * Exchanges a vendor verification receipt for the attested identity.
   * Throws when the receipt is missing/expired/forged.
   */
  verify(verificationToken: string): Promise<VerifiedIdentity>;
}
