import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

export interface WithdrawConsentCommand {
  userId: string;
  policyType: PolicyType;
}

/** A member withdraws a previously-granted consent. */
export interface WithdrawConsentUseCase {
  invoke(command: WithdrawConsentCommand): Promise<void>;
}
