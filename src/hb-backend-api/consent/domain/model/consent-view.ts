import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

/**
 * A per-policy-type view of the caller's consent state, joined with the policy's
 * current version so the client knows whether (re-)consent is required.
 */
export interface ConsentView {
  policyType: PolicyType;
  currentVersion: number;
  /** The version the user agreed to (null if never / withdrawn). */
  agreedVersion: number | null;
  /** GRANTED | WITHDRAWN | NONE. */
  status: string;
  /** True when there is no GRANTED consent at the current version. */
  needsConsent: boolean;
}
