import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

export interface ListPolicyVersionsCommand {
  actorId: string;
  type: PolicyType;
}

/** Operator views the version history of a policy type. */
export interface ListPolicyVersionsUseCase {
  invoke(command: ListPolicyVersionsCommand): Promise<PolicyDocument[]>;
}
