import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

/** Read side for consent records. */
export interface ConsentQueryPort {
  findByUser(userId: string): Promise<Consent[]>;
  findByUserAndType(
    userId: string,
    policyType: PolicyType,
  ): Promise<Consent | null>;
}
