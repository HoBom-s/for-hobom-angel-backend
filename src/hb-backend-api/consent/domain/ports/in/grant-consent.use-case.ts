import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

export interface GrantConsentCommand {
  userId: string;
  policyType: PolicyType;
  /** Must match the currently-published version of the type. */
  policyVersion: number;
}

/** A member consents to the current version of a policy. */
export interface GrantConsentUseCase {
  invoke(command: GrantConsentCommand): Promise<Consent>;
}
