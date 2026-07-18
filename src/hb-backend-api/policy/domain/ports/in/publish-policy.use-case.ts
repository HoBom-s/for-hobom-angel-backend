import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

export interface PublishPolicyCommand {
  actorId: string;
  type: PolicyType;
  title: string;
  content: string;
  /** ISO date; defaults to now when omitted. */
  effectiveDate?: string;
}

/** Operator publishes a new version of a policy document (archiving the prior). */
export interface PublishPolicyUseCase {
  invoke(command: PublishPolicyCommand): Promise<PolicyDocument>;
}
