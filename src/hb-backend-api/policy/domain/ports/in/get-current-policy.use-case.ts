import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

/** Public read of the version currently in effect for a policy type. */
export interface GetCurrentPolicyUseCase {
  invoke(type: PolicyType): Promise<PolicyDocument>;
}
